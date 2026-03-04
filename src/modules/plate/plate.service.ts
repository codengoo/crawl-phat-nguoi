import { Injectable, Logger } from '@nestjs/common';
import { ProxyRecord } from '@nghiavuive/proxy-free';
import { Locator, Page, errors } from 'playwright';
import { BrowserManagerService, ProxyService } from '../../shared/browser';
import { CacheService } from '../../shared/cache/cache.service';
import {
    VehicleType,
    ViolationData,
    ViolationResult,
} from './interfaces/violation.interface';

@Injectable()
export class PlateService {
  private readonly logger = new Logger(PlateService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly browserManager: BrowserManagerService,
    private readonly proxyService: ProxyService,
  ) {}

  /**
   * Kiểm tra trạng thái browser
   */
  async isHealthy(): Promise<boolean> {
    return this.browserManager.isHealthy();
  }

  /**
   * Restart browser nếu có vấn đề
   */
  async restart(): Promise<void> {
    this.logger.warn('🔄 Đang restart browser...');
    await this.browserManager.restart();
  }

  /**
   * Tạo cache key từ plateNumber và vehicleType
   * Format: PLATENUMBER_VEHICLETYPE (VD: 30E43807_car)
   */
  private buildCacheKey(plateNumber: string, vehicleType: VehicleType): string {
    return `${plateNumber.toUpperCase()}_${vehicleType}`;
  }

  /**
   * Tra cứu nhiều biển số xe cùng lúc (sử dụng chung một browser context)
   * @param plateNumberItems Danh sách biển số và loại xe
   * @returns Danh sách kết quả tra cứu
   */
  async lookupMultipleViolations(
    plateNumberItems: Array<{ plateNumber: string; vehicleType: VehicleType }>,
  ): Promise<ViolationResult[]> {
    // Kiểm tra browser có healthy không
    if (!(await this.isHealthy())) {
      this.logger.warn('Browser không healthy, đang restart...');
      await this.restart();
    }

    this.logger.log(`🔍 Bắt đầu tra cứu ${plateNumberItems.length} biển số`);

    const results: ViolationResult[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Tra cứu tuần tự từng biển số (sử dụng chung browser context)
    for (let i = 0; i < plateNumberItems.length; i++) {
      const item = plateNumberItems[i];
      const cacheKey = this.buildCacheKey(item.plateNumber, item.vehicleType);

      // Kiểm tra cache trước
      const cachedResult = this.cacheService.get<ViolationResult>(cacheKey);

      if (cachedResult) {
        this.logger.log(
          `[${i + 1}/${plateNumberItems.length}] 💾 Cache hit: ${item.plateNumber}`,
        );
        results.push(cachedResult);
        cacheHits++;
      } else {
        this.logger.log(
          `[${i + 1}/${plateNumberItems.length}] 🔍 Tra cứu: ${item.plateNumber}`,
        );

        const result = await this.lookupViolation(item.plateNumber, item.vehicleType);

        results.push(result);
        cacheMisses++;

        // Nghỉ ngắn giữa các request để tránh bị chặn
        if (i < plateNumberItems.length - 1 && cacheMisses > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    this.logger.log(
      `✅ Hoàn thành tra cứu ${results.length} biển số (Cache hits: ${cacheHits}, Misses: ${cacheMisses})`,
    );

    return results;
  }

  /**
   * Tra cứu vi phạm theo biển số xe (PRIVATE - chỉ dùng internal)
   * @param plateNumber Biển số xe
   * @param vehicleType Loại phương tiện
   * @returns Kết quả tra cứu
   */
  private async lookupViolation(
    plateNumber: string,
    vehicleType: VehicleType,
  ): Promise<ViolationResult> {
    // Kiểm tra cache trước
    const cacheKey = this.buildCacheKey(plateNumber, vehicleType);

    try {
      const result = await this.lookupWithProxyFallback(plateNumber, vehicleType);

      if (result.success) {
        this.cacheService.set(cacheKey, result);
        this.logger.debug(`💾 Đã cache kết quả cho: ${plateNumber}`);
      }

      return result;
    } catch (error: any) {
      this.logger.error(`❌ Lỗi khi tra cứu biển số ${plateNumber}:`, error.message);

      return {
        success: false,
        plateNumber,
        vehicleType,
        data: [],
        error: error.message,
      };
    }
  }

  private async lookupWithProxyFallback(
    plateNumber: string,
    vehicleType: VehicleType,
  ): Promise<ViolationResult> {
    try {
      return await this.executeLookup(plateNumber, vehicleType);
    } catch (error) {
      if (this.isTimeoutError(error)) {
        this.logger.warn(
          `⏳ Timeout khi tra cứu ${plateNumber}, chuyển sang thử proxy...`,
        );

        const proxyResult = await this.tryLookupWithProxies(plateNumber, vehicleType);
        if (proxyResult) return proxyResult;
      }

      throw error;
    }
  }

  private async executeLookup(
    plateNumber: string,
    vehicleType: VehicleType,
    proxy?: ProxyRecord,
  ): Promise<ViolationResult> {
    const { page, dispose } = await this.browserManager.getPage(proxy);

    try {
      const proxyInfo = proxy ? ` qua proxy ${proxy.proxy}` : '';
      this.logger.log(`🔍 Tra cứu biển số: ${plateNumber}${proxyInfo}`);

      await page.goto('https://www.csgt.vn/tra-cuu-phat-nguoi', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await page.waitForSelector('form#violationsForm', { timeout: 20000 });
      await page.selectOption('select[name="vehicle_type"]', vehicleType);
      await page.waitForTimeout(500);

      await page.fill('input[name="plate_number"]', plateNumber);
      await page.waitForTimeout(500);

      await Promise.all([
        page.click('#submitBtn'),
        page.waitForLoadState('networkidle', { timeout: 15000 }),
      ]);

      await page.waitForTimeout(3000);

      const violationCount = await page.locator('.violation-card').count();

      if (violationCount === 0) {
        this.logger.log(`ℹ️  Không tìm thấy vi phạm cho biển số ${plateNumber}`);
        return {
          success: true,
          plateNumber,
          vehicleType,
          data: [],
        };
      }

      this.logger.log(`📋 Tìm thấy ${violationCount} vi phạm, đang parse...`);
      const violationData = await this.extractAllViolations(page);

      this.logger.log(`✅ Tra cứu thành công! Tìm thấy ${violationData.length} vi phạm.`);

      return {
        success: true,
        plateNumber,
        vehicleType,
        data: violationData,
      };
    } finally {
      await dispose();
    }
  }

  private async tryLookupWithProxies(
    plateNumber: string,
    vehicleType: VehicleType,
  ): Promise<ViolationResult | null> {
    const proxies = await this.proxyService.getBestProxies();

    if (!proxies.length) {
      this.logger.warn('Không có proxy nào để thử.');
      return null;
    }

    for (const proxy of proxies) {
      const isAlive = await this.proxyService.isProxyAlive(proxy);

      if (!isAlive) {
        this.logger.warn(`Proxy ${proxy.proxy} không hoạt động, bỏ qua.`);
        continue;
      }

      try {
        this.logger.log(`🔁 Đang thử tra cứu ${plateNumber} qua proxy ${proxy.proxy}`);
        return await this.executeLookup(plateNumber, vehicleType, proxy);
      } catch (error) {
        if (!this.isTimeoutError(error)) {
          throw error;
        }

        this.logger.warn(`Proxy ${proxy.proxy} bị timeout, thử proxy tiếp theo...`);
      }
    }

    this.logger.warn('Đã thử hết danh sách proxy nhưng vẫn gặp lỗi timeout.');
    return null;
  }

  private isTimeoutError(error: unknown): boolean {
    if (!error) return false;
    if (error instanceof errors.TimeoutError) return true;

    const message = (error as any)?.message;
    return typeof message === 'string' && message.toLowerCase().includes('timeout');
  }

  /**
   * Trích xuất tất cả vi phạm từ trang kết quả
   */
  private async extractAllViolations(page: Page): Promise<ViolationData[]> {
    try {
      const violationCards = page.locator('.violation-card');
      const count = await violationCards.count();
      const violations: ViolationData[] = [];

      for (let i = 0; i < count; i++) {
        const violation = await this.extractViolationFromCard(violationCards.nth(i));
        if (violation) violations.push(violation);
      }

      return violations;
    } catch (error: any) {
      this.logger.error('Lỗi khi trích xuất dữ liệu:', error.message);
      return [];
    }
  }

  /**
   * Trích xuất dữ liệu từ một violation card
   */
  private async extractViolationFromCard(
    violationCard: Locator,
  ): Promise<ViolationData | null> {
    try {
      console.log("content", await violationCard.innerHTML());

      // Lấy trạng thái
      const status = await violationCard
        .locator('.status-badge')
        .textContent()
        .then((text: string | null) => text?.trim() || '');

      // Lấy thông tin phương tiện
      const vehicleTypeText = await this.getInfoValue(violationCard, 'Loại xe:');
      const plateColor = await this.getInfoValue(violationCard, 'Màu biển:');

      // Lấy chi tiết vi phạm
      const violationType = await this.getInfoValue(violationCard, 'Lỗi vi phạm:');
      const time = await this.getInfoValue(violationCard, 'Thời gian:');
      const location = await this.getInfoValue(violationCard, 'Địa điểm:');

      // Lấy thông tin xử lý
      const detectingUnit = await this.getInfoValue(violationCard, 'Đơn vị phát hiện:');
      const detectingAddress = await this.getInfoValue(violationCard, 'Địa chỉ:', 0);
      const resolvingUnit = await this.getInfoValue(violationCard, 'Đơn vị giải quyết:');
      const resolvingAddress = await this.getInfoValue(violationCard, 'Địa chỉ:', 1);
      const phone = await this.getInfoValue(violationCard, 'Điện thoại:');

      return {
        plateNumber: 'a',
        status,
        vehicleInfo: {
          vehicleType: vehicleTypeText,
          plateColor,
        },
        violationDetail: {
          violationType,
          time,
          location,
        },
        processingUnit: {
          detectingUnit,
          detectingAddress,
          resolvingUnit,
          resolvingAddress,
          phone: phone || undefined,
        },
      };
    } catch (error: any) {
      this.logger.error('Lỗi khi trích xuất card:', error.message);
      return null;
    }
  }

  /**
   * Lấy giá trị thông tin từ label
   */
  private async getInfoValue(
    container: any,
    label: string,
    index: number = 0,
  ): Promise<string> {
    try {
      const items = container.locator('.info-item');
      const count = await items.count();

      let matchCount = 0;
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const labelText = await item.locator('.label').textContent();

        if (labelText?.includes(label)) {
          if (matchCount === index) {
            const value = await item.locator('.value').textContent();
            return value?.trim() || '';
          }
          matchCount++;
        }
      }

      return '';
    } catch (error) {
      return '';
    }
  }
}
