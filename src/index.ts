import { chromium, Browser, Page } from 'playwright';

enum EVehicleType {
    Motorbike = 'motorbike',
    Car = 'car',
    ElectricBike = 'electricbike'
}

interface VehicleInfo {
    vehicleType: string;
    plateColor: string;
}

interface ViolationDetail {
    violationType: string;
    time: string;
    location: string;
}

interface ProcessingUnit {
    detectingUnit: string;
    detectingAddress: string;
    resolvingUnit: string;
    resolvingAddress: string;
    phone?: string;
}

interface ViolationData {
    plateNumber: string;
    status: string;
    vehicleInfo: VehicleInfo;
    violationDetail: ViolationDetail;
    processingUnit: ProcessingUnit;
}

interface ViolationResult {
    success: boolean;
    plateNumber: string;
    vehicleType: string;
    data?: ViolationData[];
    error?: string;
    screenshot?: string;
}

class CSGTCrawler {
    private browser: Browser | null = null;
    private page: Page | null = null;

    /**
     * Khởi tạo browser
     */
    async init(headless: boolean = false): Promise<void> {
        console.log('Đang khởi tạo browser...');
        this.browser = await chromium.launch({
            headless: headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 800, height: 600 }
        });

        this.page = await context.newPage();
        console.log('Browser đã sẵn sàng!');
    }

    async lookupViolation(
        plateNumber: string,
        vehicleType: EVehicleType
    ): Promise<ViolationResult> {
        if (!this.page)
            throw new Error('Browser chưa được khởi tạo. Gọi init() trước.');

        console.log(`\n🔍 Đang tra cứu biển số: ${plateNumber}`);

        try {
            // Truy cập trang tra cứu
            console.log('Đang truy cập trang tra cứu...');
            await this.page.goto('https://www.csgt.vn/tra-cuu-phat-nguoi', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            // Đợi form load
            await this.page.waitForSelector('form#violationsForm', { timeout: 20000 });

            // Chọn loại phương tiện
            console.log(`Chọn loại phương tiện: ${vehicleType}...`);
            await this.page.selectOption('select[name="vehicle_type"]', vehicleType);
            await this.page.waitForTimeout(500);

            // Nhập biển số xe
            console.log('Nhập biển số xe...');
            await this.page.fill('input[name="plate_number"]', plateNumber);
            await this.page.waitForTimeout(500);

            // Chụp màn hình trước khi submit
            const screenshotBefore = `screenshots_${Date.now()}.png`;
            await this.page.screenshot({ path: screenshotBefore, fullPage: true });

            // Click nút tra cứu
            console.log('Đang thực hiện tra cứu...');
            await Promise.all([
                this.page.click('#submitBtn'),
                this.page.waitForLoadState('networkidle', { timeout: 15000 })
            ]);

            // Đợi kết quả
            await this.page.waitForTimeout(3000);

            // Chụp màn hình kết quả
            const screenshotAfter = `screenshots/result_${plateNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
            await this.page.screenshot({ path: screenshotAfter, fullPage: true });

            // Kiểm tra có vi phạm không
            const violationCount = await this.page.locator('.violation-card').count();

            if (violationCount === 0) {
                console.log('ℹ️  Không tìm thấy vi phạm');
                return {
                    success: true,
                    plateNumber,
                    vehicleType,
                    data: [],
                    screenshot: screenshotAfter
                };
            }

            // Parse dữ liệu vi phạm
            console.log(`📋 Tìm thấy ${violationCount} vi phạm, đang parse dữ liệu...`);
            const violationData = await this.extractAllViolations();

            console.log(`✅ Tra cứu thành công! Tìm thấy ${violationData.length} vi phạm.`);
            return {
                success: true,
                plateNumber,
                vehicleType,
                data: violationData,
                screenshot: screenshotAfter
            };

        } catch (error: any) {
            console.error('❌ Lỗi trong quá trình tra cứu:', error.message);

            const screenshotError = `screenshots/error_${plateNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
            if (this.page) {
                await this.page.screenshot({ path: screenshotError, fullPage: true }).catch(() => { });
            }

            return {
                success: false,
                plateNumber,
                vehicleType,
                error: error.message,
                screenshot: screenshotError
            };
        }
    }

    /**
     * Trích xuất tất cả dữ liệu vi phạm từ trang kết quả
     */
    private async extractAllViolations(): Promise<ViolationData[]> {
        if (!this.page) return [];

        try {
            const violationCards = this.page.locator('.violation-card');
            const count = await violationCards.count();
            const violations: ViolationData[] = [];

            for (let i = 0; i < count; i++) {
                console.log(`  ⏳ Đang parse vi phạm ${i + 1}/${count}...`);
                const violation = await this.extractViolationFromCard(violationCards.nth(i));
                if (violation) {
                    violations.push(violation);
                }
            }

            return violations;

        } catch (error: any) {
            console.error('Lỗi khi trích xuất dữ liệu:', error.message);
            return [];
        }
    }

    /**
     * Trích xuất dữ liệu từ một violation card
     */
    private async extractViolationFromCard(violationCard: any): Promise<ViolationData | null> {
        try {
            // Lấy biển số
            const plateNumber = await violationCard.locator('.violation-title').textContent()
                .then((text: string | null) => text?.replace(/[^0-9A-Z.-]/g, '').trim() || '');

            // Lấy trạng thái
            const status = await violationCard.locator('.status-badge').textContent()
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
                plateNumber,
                status,
                vehicleInfo: {
                    vehicleType: vehicleTypeText,
                    plateColor
                },
                violationDetail: {
                    violationType,
                    time,
                    location
                },
                processingUnit: {
                    detectingUnit,
                    detectingAddress,
                    resolvingUnit,
                    resolvingAddress,
                    phone: phone || undefined
                }
            };

        } catch (error: any) {
            console.error('Lỗi khi trích xuất card:', error.message);
            return null;
        }
    }

    /**
     * Lấy giá trị thông tin từ label
     */
    private async getInfoValue(container: any, label: string, index: number = 0): Promise<string> {
        try {
            // Tìm tất cả các info-item
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

    /**
     * Đóng browser
     */
    async close(): Promise<void> {
        if (this.browser) {
            console.log('\nĐang đóng browser...');
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log('Hoàn tất!');
        }
    }
}

// Ví dụ sử dụng
async function main() {
    const crawler = new CSGTCrawler();

    try {
        // Khởi tạo browser (headless: false để xem quá trình, true để chạy ẩn)
        await crawler.init(false);

        // Tra cứu một biển số
        const result = await crawler.lookupViolation('30F81785', EVehicleType.Car); // Ô tô
        console.log('\n📊 Kết quả tra cứu:');
        console.log(JSON.stringify(result, null, 2));


    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await crawler.close();
    }
}

// Chạy chương trình
if (require.main === module) {
    main();
}

export { CSGTCrawler, ViolationResult };
