# 🚗 CSGT Violation Lookup Service

REST API service sử dụng NestJS và Playwright để tra cứu thông tin xe vi phạm từ cổng thông tin CSGT Việt Nam.

## 📋 Tính năng

- ✅ REST API với NestJS framework
- ✅ Tra cứu vi phạm theo biển số xe
- ✅ Tra cứu nhiều biển số cùng lúc (bulk lookup)
- ✅ Hỗ trợ nhiều loại phương tiện (xe máy, ô tô, xe đạp điện)
- ✅ Tái sử dụng browser context để tối ưu hiệu suất
- ✅ Health check endpoints để monitor browser
- ✅ Swagger API documentation
- ✅ Docker & Docker Compose support
- ✅ Production-ready với error handling
- ✅ Automatic browser restart khi có lỗi

## 🏗️ Kiến trúc

```
src/
├── main.ts                 # Entry point
├── app.module.ts           # Root module
├── crawler/                # Crawler module
│   ├── crawler.module.ts
│   ├── crawler.service.ts  # Camoufox browser service
│   ├── crawler.controller.ts
│   ├── dto/               # Data Transfer Objects
│   │   ├── lookup-violation.dto.ts
│   │   ├── lookup-multiple-violation.dto.ts
│   │   ├── violation-response.dto.ts
│   │   └── multiple-violation-response.dto.ts
│   └── interfaces/        # TypeScript interfaces
│       └── violation.interface.ts
└── health/                # Health check module
    ├── health.module.ts
    ├── health.service.ts
    └── health.controller.ts
```

## 🚀 Quick Start

### Development (Local)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cài đặt Playwright browsers
npm run install:browsers

# 3. Copy environment file
cp .env.example .env

# 4. Chạy development server
npm run start:dev
```

Server sẽ chạy tại: http://localhost:3000
API Docs: http://localhost:3000/api-docs

### Docker (Production)

```bash
# Build và chạy với docker-compose
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop service
docker-compose down
```

## 📚 API Documentation

### 1. Tra cứu vi phạm

**Endpoint:** `POST /violations/lookup`

**Request Body:**
```json
{
  "plateNumber": "30E43807",
  "vehicleType": "car"
}
```

**Vehicle Types:**
- `motorbike` - Xe máy
- `car` - Ô tô
- `electricbike` - Xe đạp điện

**Response (Có vi phạm):**
```json
{
  "success": true,
  "plateNumber": "30E43807",
  "vehicleType": "car",
  "data": [
    {
      "plateNumber": "30E-438.07",
      "status": "Chưa xử phạt",
      "vehicleInfo": {
        "vehicleType": "Ô tô",
        "plateColor": "Nền màu trắng, chữ và số màu đen"
      },
      "violationDetail": {
        "violationType": "16824.6.9.b.01.Không chấp hành hiệu lệnh của đèn tín hiệu giao thông",
        "time": "10:24, 29/12/2025",
        "location": "Tràng Tiền - Trần Quang Khải (VT87), Phường Hoàn Kiếm, Thành phố Hà Nội"
      },
      "processingUnit": {
        "detectingUnit": "Đội CHGT&ĐK Đèn THGT - Phòng Cảnh sát giao thông - Công an Thành phố Hà Nội",
        "detectingAddress": "Số 54 Trần Hưng Đạo, Phường Cửa Nam, Hà Nội",
        "resolvingUnit": "Đội CSGT ĐB số 6 - Phòng Cảnh sát giao thông - Công an Thành phố Hà Nội",
        "resolvingAddress": "số 2 Phạm Hùng, Phường Từ Liêm, Hà Nội",
        "phone": "02437683373"
      }
    }
  ]
}
```

**Response (Không có vi phạm):**
```json
{
  "success": true,
  "plateNumber": "30E43807",
  "vehicleType": "car",
  "data": []
}
```

**Response (Lỗi):**
```json
{
  "success": false,
  "plateNumber": "30E43807",
  "vehicleType": "car",
  "data": [],
  "error": "Timeout exceeded"
}
```

### 2. Tra cứu nhiều vi phạm

**Endpoint:** `POST /violations/lookup/multiple`

**Request Body:**
```json
{
  "plateNumbers": [
    {
      "plateNumber": "30E43807",
      "vehicleType": "car"
    },
    {
      "plateNumber": "51F12345",
      "vehicleType": "motorbike"
    },
    {
      "plateNumber": "29H67890",
      "vehicleType": "car"
    }
  ]
}
```

**Giới hạn:** Tối thiểu 1, tối đa 20 biển số trong một request

**Response:**
```json
{
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "success": true,
      "plateNumber": "30E43807",
      "vehicleType": "car",
      "data": []
    },
    {
      "success": true,
      "plateNumber": "51F12345",
      "vehicleType": "motorbike",
      "data": []
    },
    {
      "success": true,
      "plateNumber": "29H67890",
      "vehicleType": "car",
      "data": []
    }
  ]
}
```

**Ưu điểm:**
- Sử dụng chung một browser context, hiệu suất cao
- Không cần mở/đóng browser nhiều lần
- Phù hợp khi cần tra cứu nhiều biển số

### 3. Health Check

**Endpoint:** `GET /health`

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T10:30:00.000Z",
  "uptime": 3600,
  "browser": {
    "status": "connected",
    "healthy": true
  }
}
```

### 4. Browser Health Check

**Endpoint:** `GET /health/browser`

```bash
curl http://localhost:3000/health/browser
```

**Response:**
```json
{
  "healthy": true,
  "status": "connected",
  "message": "Browser đang hoạt động bình thường"
}
```

### 5. Restart Browser

**Endpoint:** `POST /health/browser/restart`

```bash
curl -X POST http://localhost:3000/health/browser/restart
```

**Response:**
```json
{
  "success": true,
  "message": "Browser đã được restart thành công"
}
```

## 🧪 Testing

### Test với cURL

```bash
# Tra cứu vi phạm
curl -X POST http://localhost:3000/violations/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "30E43807",
    "vehicleType": "car"
  }'

# Health check
curl http://localhost:3000/health

# Browser status
curl http://localhost:3000/health/browser
```

### Test với Postman

Import file Postman collection (xem thư mục `/docs`) hoặc truy cập Swagger UI tại:
```
http://localhost:3000/api-docs
```

## 🔧 Scripts

```bash
# Development
npm run start:dev       # Chạy dev server với hot-reload
npm run start:debug     # Chạy với debug mode

# Build & Production
npm run build           # Build production
npm run start:prod      # Chạy production build

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage

# Docker
docker-compose up -d         # Start service
docker-compose down          # Stop service
docker-compose logs -f       # View logs
docker-compose restart       # Restart service
```

## 📦 Docker

### Build Image

```bash
docker build -t csgt-crawler:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  --name csgt-crawler \
  -e NODE_ENV=production \
  csgt-crawler:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Scale service
docker-compose up -d --scale csgt-crawler=3

# View logs
docker-compose logs -f csgt-crawler

# Stop all services
docker-compose down
```

## ⚙️ Configuration

Environment variables (`.env`):

```bash
# Server
PORT=3000
NODE_ENV=development

# Playwright
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
```

## 🐛 Troubleshooting

### Browser không khởi động

```bash
# Kiểm tra status
curl http://localhost:3000/health/browser

# Restart browser
curl -X POST http://localhost:3000/health/browser/restart
```

### Docker container bị crash

```bash
# Xem logs
docker-compose logs csgt-crawler

# Restart container
docker-compose restart csgt-crawler
```

### Memory issues

Tăng memory limit trong `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

## 📊 Performance

- **Response time:** ~3-5 giây/request
- **Memory usage:** ~1-1.5GB (bao gồm browser)
- **CPU usage:** ~20-30% khi crawl
- **Concurrent requests:** Tối đa 5-10 requests đồng thời

## 🔒 Security

- ✅ Input validation với class-validator
- ✅ Helmet.js cho security headers (có thể thêm)
- ✅ Rate limiting (có thể thêm)
- ✅ CORS enabled
- ✅ Không lưu trữ dữ liệu người dùng

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

Service này chỉ dùng cho mục đích tra cứu hợp pháp. Vui lòng tuân thủ quy định và không spam requests.

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs: `docker-compose logs -f`
2. Kiểm tra health: `curl http://localhost:3000/health`
3. Restart service: `docker-compose restart`

---

Made with ❤️ using NestJS & Playwright
