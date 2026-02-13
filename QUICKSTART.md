# 🚀 Quick Start Guide

## Cài đặt nhanh với Docker (Khuyến nghị)

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd crawl
```

### Bước 2: Chạy với Docker Compose

```bash
docker-compose up -d
```

### Bước 3: Kiểm tra service

```bash
# Health check
curl http://localhost:3000/health

# Browser status
curl http://localhost:3000/health/browser
```

### Bước 4: Test API

```bash
curl -X POST http://localhost:3000/violations/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "30E43807",
    "vehicleType": "car"
  }'
```

### Bước 5: Truy cập API Documentation

Mở browser và truy cập: http://localhost:3000/api-docs

## Cài đặt Development (Local)

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Cài đặt Playwright browsers

```bash
npm run install:browsers
```

### Bước 3: Copy environment file

```bash
cp .env.example .env
```

### Bước 4: Chạy development server

```bash
npm run start:dev
```

Server sẽ chạy tại: http://localhost:3000

## API Endpoints

### 1. Tra cứu vi phạm

```http
POST /violations/lookup
Content-Type: application/json

{
  "plateNumber": "30E43807",
  "vehicleType": "car"
}
```

### 2. Health check

```http
GET /health
```

### 3. Browser status

```http
GET /health/browser
```

### 4. Restart browser

```http
POST /health/browser/restart
```

## Loại phương tiện

- `motorbike` - Xe máy
- `car` - Ô tô
- `electricbike` - Xe đạp điện

## Xem thêm

- [README.md](README.md) - Tài liệu đầy đủ
- [API Examples](docs/API_EXAMPLES.md) - Ví dụ sử dụng API
- [Deployment Guide](docs/DEPLOYMENT.md) - Hướng dẫn deploy
- [Architecture](docs/ARCHITECTURE.md) - Kiến trúc hệ thống

## Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker-compose logs -f`
2. Restart service: `docker-compose restart`
3. Kiểm tra health: `curl http://localhost:3000/health`

---

Happy coding! 🎉
