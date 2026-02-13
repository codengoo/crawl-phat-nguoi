import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import {
  ViolationResult,
  ViolationData,
  VehicleType,
} from './interfaces/violation.interface';

@Injectable()
export class CrawlerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isInitialized = false;

  /**
   * Khởi tạo browser khi module được load
   */
  async onModuleInit() {
    await this.initBrowser();
  }

  /**
   * Đóng browser khi module bị destroy
   */
  async onModuleDestroy() {
    await this.closeBrowser();
  }

  /**
   * Khởi tạo Playwright browser
   */
  private async initBrowser(): Promise<void> {
    try {
      this.logger.log('Đang khởi tạo Playwright browser...');

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
      });

      this.isInitialized = true;
      this.logger.log('✅ Browser đã sẵn sàng!');
    } catch (error) {
      this.logger.error('❌ Lỗi khi khởi tạo browser:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Đóng browser
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      this.logger.log('Đóng browser...');
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.isInitialized = false;
    }
  }

  /**
   * Kiểm tra trạng thái browser
   */
  async isHealthy(): Promise<boolean> {
    return this.isInitialized && this.browser !== null && this.browser.isConnected();
  }

  /**
   * Restart browser nếu có vấn đề
   */
  async restart(): Promise<void> {
    this.logger.warn('🔄 Đang restart browser...');
    await this.closeBrowser();
    await this.initBrowser();
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
    
    // Tra cứu tuần tự từng biển số (sử dụng chung browser context)
    for (let i = 0; i < plateNumberItems.length; i++) {
      const item = plateNumberItems[i];
      this.logger.log(
        `[${i + 1}/${plateNumberItems.length}] Tra cứu: ${item.plateNumber}`,
      );
      
      const result = await this.lookupViolation(
        item.plateNumber,
        item.vehicleType,
      );
      
      results.push(result);
      
      // Nghỉ ngắn giữa các request để tránh bị chặn
      if (i < plateNumberItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.logger.log(
      `✅ Hoàn thành tra cứu ${results.length} biển số`,
    );
    
    return results;
  }

  /**
   * Tra cứu vi phạm theo biển số xe
   * @param plateNumber Biển số xe
   * @param vehicleType Loại phương tiện
   * @returns Kết quả tra cứu
   */
  async lookupViolation(
    plateNumber: string,
    vehicleType: VehicleType,
  ): Promise<ViolationResult> {
    // Kiểm tra browser có healthy không
    if (!(await this.isHealthy())) {
      this.logger.warn('Browser không healthy, đang restart...');
      await this.restart();
    }

    let page: Page | null = null;

    try {
      this.logger.log(`🔍 Tra cứu biển số: ${plateNumber}`);

      // Tạo page mới từ context
      page = await this.context!.newPage();

      // Truy cập trang tra cứu
      await page.goto('https://www.csgt.vn/tra-cuu-phat-nguoi', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Đợi form load
      await page.waitForSelector('form#violationsForm', { timeout: 20000 });

      // Chọn loại phương tiện
      await page.selectOption('select[name="vehicle_type"]', vehicleType);
      await page.waitForTimeout(500);

      // Nhập biển số xe
      await page.fill('input[name="plate_number"]', plateNumber);
      await page.waitForTimeout(500);

      // Click nút tra cứu
      await Promise.all([
        page.click('#submitBtn'),
        page.waitForLoadState('networkidle', { timeout: 15000 }),
      ]);

      // Đợi kết quả
      await page.waitForTimeout(3000);

      // Kiểm tra có vi phạm không
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

      // Parse dữ liệu vi phạm
      this.logger.log(`📋 Tìm thấy ${violationCount} vi phạm, đang parse...`);
      const violationData = await this.extractAllViolations(page);

      this.logger.log(
        `✅ Tra cứu thành công! Tìm thấy ${violationData.length} vi phạm.`,
      );

      return {
        success: true,
        plateNumber,
        vehicleType,
        data: violationData,
      };
    } catch (error: any) {
      this.logger.error(`❌ Lỗi khi tra cứu biển số ${plateNumber}:`, error.message);

      return {
        success: false,
        plateNumber,
        vehicleType,
        data: [],
        error: error.message,
      };
    } finally {
      // Đóng page sau khi xong
      if (page) {
        await page.close();
      }
    }
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
        const violation = await this.extractViolationFromCard(
          violationCards.nth(i),
        );
        if (violation) {
          violations.push(violation);
        }
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
    violationCard: any,
  ): Promise<ViolationData | null> {
    try {
      // Lấy biển số
      const plateNumber = await violationCard
        .locator('.violation-title')
        .textContent()
        .then((text: string | null) =>
          text?.replace(/[^0-9A-Z.-]/g, '').trim() || '',
        );

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
      const detectingUnit = await this.getInfoValue(
        violationCard,
        'Đơn vị phát hiện:',
      );
      const detectingAddress = await this.getInfoValue(violationCard, 'Địa chỉ:', 0);
      const resolvingUnit = await this.getInfoValue(
        violationCard,
        'Đơn vị giải quyết:',
      );
      const resolvingAddress = await this.getInfoValue(violationCard, 'Địa chỉ:', 1);
      const phone = await this.getInfoValue(violationCard, 'Điện thoại:');

      return {
        plateNumber,
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
