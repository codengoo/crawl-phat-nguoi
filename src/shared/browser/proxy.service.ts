import { Injectable, Logger } from '@nestjs/common';
import { ProxyRecord, ProxyScrapeClient } from '@nghiavuive/proxy-free';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly client = new ProxyScrapeClient();

  async getBestProxies(): Promise<ProxyRecord[]> {
    try {
      const proxies = await this.client.getBestRandom();

      if (!proxies.length) {
        this.logger.warn('ProxyScrape không trả về proxy nào.');
      }

      return proxies;
    } catch (error: any) {
      this.logger.error('Lỗi khi lấy danh sách proxy:', error?.message || error);
      return [];
    }
  }

  async isProxyAlive(proxy: ProxyRecord): Promise<boolean> {
    try {
      return await ProxyScrapeClient.checkProxy(proxy);
    } catch (error: any) {
      this.logger.warn(
        `Không kiểm tra được proxy ${proxy.proxy}: ${error?.message ?? error}`,
      );
      return false;
    }
  }
}
