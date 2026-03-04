import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
    Browser,
    BrowserContext,
    BrowserContextOptions,
    Page,
    chromium,
} from 'playwright';
import { ProxyRecord } from '@nghiavuive/proxy-free';

export interface PageHandle {
    page: Page;
    dispose: () => Promise<void>;
}

@Injectable()
export class BrowserManagerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BrowserManagerService.name);
    private browser: Browser | null = null;
    private sharedContext: BrowserContext | null = null;

    async onModuleInit() {
        await this.initBrowser();
    }

    async onModuleDestroy() {
        await this.closeBrowser();
    }

    async isHealthy(): Promise<boolean> {
        return Boolean(this.browser && this.browser.isConnected());
    }

    async restart(): Promise<void> {
        this.logger.warn('🔄 Đang restart Playwright browser...');
        await this.closeBrowser();
        await this.initBrowser();
    }

    async getPage(proxy?: ProxyRecord): Promise<PageHandle> {
        if (!this.browser || !this.browser.isConnected()) {
            await this.initBrowser();
        }

        if (proxy) {
            const context = await this.browser!.newContext(
                this.buildContextOptions(this.buildProxyConfig(proxy)),
            );
            const page = await context.newPage();
            return {
                page,
                dispose: async () => {
                    await this.safeClosePage(page);
                    await context.close();
                },
            };
        }

        await this.ensureSharedContext();
        const page = await this.sharedContext!.newPage();
        return {
            page,
            dispose: async () => {
                await this.safeClosePage(page);
            },
        };
    }

    private async initBrowser(): Promise<void> {
        if (this.browser && this.browser.isConnected()) {
            return;
        }

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

            this.sharedContext = await this.browser.newContext(this.buildContextOptions());
            this.logger.log('✅ Browser đã sẵn sàng!');
        } catch (error) {
            this.logger.error('❌ Lỗi khi khởi tạo browser:', error);
            this.browser = null;
            this.sharedContext = null;
            throw error;
        }
    }

    private async closeBrowser(): Promise<void> {
        if (this.sharedContext) {
            await this.sharedContext.close();
            this.sharedContext = null;
        }

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    private buildContextOptions(
        proxy?: BrowserContextOptions['proxy'],
    ): BrowserContextOptions {
        const options: BrowserContextOptions = {
            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1366, height: 768 },
            ignoreHTTPSErrors: true,
        };

        if (proxy) {
            options.proxy = proxy;
        }

        return options;
    }

    private async ensureSharedContext() {
        if (!this.browser) await this.initBrowser();

        if (!this.sharedContext && this.browser) {
            this.sharedContext = await this.browser.newContext(
                this.buildContextOptions(),
            );
        }
    }

    private buildProxyConfig(proxy: ProxyRecord): BrowserContextOptions['proxy'] {
        const protocol = proxy.protocol || 'http';
        return {
            server: `${protocol}://${proxy.ip}:${proxy.port}`,
        };
    }

    private async safeClosePage(page: Page): Promise<void> {
        if (page.isClosed()) return;

        try {
            await page.close();
        } catch (error) {
            this.logger.warn('Không thể đóng page:', error);
        }
    }
}
