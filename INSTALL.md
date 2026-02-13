# 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG

## Bước 1: Cài đặt Dependencies

Mở terminal trong thư mục dự án và chạy:

```bash
npm install
```

## Bước 2: Cài đặt Playwright Browser

```bash
npm run install:browsers
```

Hoặc:

```bash
npx playwright install chromium
```

## Bước 3: Test thử

### Cách 1: Sử dụng file example

```bash
# Tra cứu một biển số
npm run example

# Tra cứu nhiều biển số
npm run example:multiple
```

**Lưu ý:** Cần mở file [src/example.ts](src/example.ts) và thay đổi biển số để test với dữ liệu thật!

### Cách 2: Sử dụng CLI tương tác

```bash
npm run cli
```

CLI sẽ hướng dẫn bạn nhập biển số và các thông tin cần thiết.

### Cách 3: Tích hợp vào code của bạn

Tạo file mới hoặc import vào code:

```typescript
import { CSGTCrawler } from './src/index';

async function myLookup() {
  const crawler = new CSGTCrawler();
  
  // Khởi tạo (false = hiện browser, true = ẩn browser)
  await crawler.init(false);
  
  // Tra cứu
  const result = await crawler.lookupViolation('30A12345', '2');
  console.log(result);
  
  // Đóng browser
  await crawler.close();
}

myLookup();
```

## 📝 Các lệnh có sẵn

| Lệnh | Mô tả |
|------|-------|
| `npm install` | Cài đặt dependencies |
| `npm run install:browsers` | Cài đặt Chromium cho Playwright |
| `npm run build` | Biên dịch TypeScript sang JavaScript |
| `npm run dev` | Chạy file chính với ts-node |
| `npm run example` | Chạy ví dụ tra cứu một biển số |
| `npm run example:multiple` | Chạy ví dụ tra cứu nhiều biển số |
| `npm run cli` | Chạy công cụ CLI tương tác |
| `npm start` | Chạy file đã build (sau khi npm run build) |

## 🎯 Loại phương tiện

- `'1'` - Xe máy
- `'2'` - Ô tô  
- `'3'` - Xe khác

## 📸 Screenshots

Tất cả screenshots sẽ được lưu trong thư mục `screenshots/`:
- `before_*.png` - Trước khi tra cứu
- `result_*.png` - Kết quả tra cứu
- `error_*.png` - Khi có lỗi xảy ra

## ⚡ Quick Start

```bash
# 1. Cài đặt
npm install
npm run install:browsers

# 2. Chạy thử CLI
npm run cli

# 3. Hoặc sửa file example và chạy
# Mở src/example.ts, thay biển số, sau đó:
npm run example
```

## 🔧 Tùy chỉnh

### Thay đổi selector

Nếu trang web CSGT thay đổi cấu trúc, bạn cần cập nhật các selector trong file [src/index.ts](src/index.ts):

- Dòng 57: Selector cho input biển số
- Dòng 61: Selector cho dropdown loại xe
- Dòng 68: Selector cho nút tra cứu
- Hàm `extractViolationData()`: Selector cho dữ liệu kết quả

### Thay đổi timeout

Trong file [src/index.ts](src/index.ts), tìm các giá trị timeout và điều chỉnh:
- `waitUntil: 'networkidle'` - Đợi network yên
- `timeout: 30000` - Timeout 30 giây
- `waitForTimeout(500)` - Đợi 0.5 giây

## 🐛 Troubleshooting

### Lỗi: "Browser not installed"
```bash
npx playwright install chromium
```

### Lỗi: "Timeout waiting for selector"
- Kiểm tra lại các selector trong code
- Tăng giá trị timeout
- Kiểm tra trang web có thay đổi cấu trúc không

### Lỗi: "Navigation timeout"
- Kiểm tra kết nối internet
- Tăng timeout trong `page.goto()`
- Thử truy cập trang web thủ công để xem có bị chặn không

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra trang web có hoạt động bình thường không
2. Xem log chi tiết trong console
3. Kiểm tra screenshot trong thư mục `screenshots/`
4. Thử chạy với `headless: false` để xem browser hoạt động

## ⚠️ Lưu ý quan trọng

- **Chỉ sử dụng cho mục đích tra cứu hợp pháp**
- **Không spam requests** - có delay giữa các lần tra cứu
- **Selector có thể thay đổi** khi trang web cập nhật
- **Cần update code** nếu trang web thay đổi cấu trúc
