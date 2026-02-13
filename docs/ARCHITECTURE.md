# Architecture Documentation

## System Overview

CSGT Crawler Service là một REST API được xây dựng trên NestJS framework, sử dụng Playwright để crawl dữ liệu vi phạm giao thông từ trang web CSGT Việt Nam.

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│ (Browser/   │
│  Mobile/API)│
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────────┐
│        NestJS Application               │
│  ┌───────────────────────────────────┐  │
│  │      Controllers Layer            │  │
│  │  - CrawlerController              │  │
│  │  - HealthController               │  │
│  └──────────┬────────────────────────┘  │
│             │                            │
│  ┌──────────▼────────────────────────┐  │
│  │      Services Layer               │  │
│  │  - CrawlerService                 │  │
│  │  - HealthService                  │  │
│  └──────────┬────────────────────────┘  │
│             │                            │
│  ┌──────────▼────────────────────────┐  │
│  │    Playwright Browser             │  │
│  │  - Chromium Instance              │  │
│  │  - Page Management                │  │
│  │  - Data Extraction                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
               │
               ▼
     ┌─────────────────┐
     │  CSGT Website   │
     │ csgt.vn         │
     └─────────────────┘
```

## Module Structure

### 1. App Module (Root)
- Entry point của application
- Import các feature modules
- Cấu hình global settings

### 2. Crawler Module
**Responsibilities:**
- Quản lý Playwright browser lifecycle
- Crawl dữ liệu từ CSGT website
- Parse HTML thành structured data
- Handle errors và retry logic

**Components:**
- `CrawlerService`: Core business logic
- `CrawlerController`: HTTP endpoints
- DTOs: Data validation
- Interfaces: Type definitions

### 3. Health Module
**Responsibilities:**
- Monitor application health
- Check browser status
- Provide restart mechanism

**Components:**
- `HealthService`: Health check logic
- `HealthController`: Health endpoints

## Data Flow

### Tra cứu vi phạm

```
1. Client Request
   ↓
2. Controller (Validation)
   ↓
3. Service (Business Logic)
   ↓
4. Playwright Browser
   ↓
5. Navigate to CSGT Website
   ↓
6. Fill Form & Submit
   ↓
7. Wait for Results
   ↓
8. Parse HTML
   ↓
9. Extract Data
   ↓
10. Return Response
```

## Design Patterns

### 1. Dependency Injection
NestJS's DI container quản lý lifecycle của tất cả services và controllers.

### 2. Module Pattern
Code được tổ chức thành các modules độc lập, dễ maintain và test.

### 3. DTO Pattern
Validation và transformation data sử dụng class-validator và class-transformer.

### 4. Service Layer Pattern
Business logic được tách biệt khỏi controllers.

### 5. Singleton Pattern
Browser instance được share giữa các requests để optimize performance.

## Error Handling

### Browser Errors
- Automatic retry on connection errors
- Health check để detect browser issues
- Restart mechanism khi browser crash

### Network Errors
- Timeout configuration
- Graceful error messages
- Fallback responses

### Validation Errors
- Input validation với class-validator
- Clear error messages
- HTTP 400 responses

## Performance Optimization

### Browser Management
- **Reuse browser instance**: Không tạo mới browser cho mỗi request
- **Context per request**: Tạo browser context riêng cho isolation
- **Page pooling**: Close page sau mỗi request

### Resource Management
- **Memory limits**: Docker resource constraints
- **Connection pooling**: Reuse HTTP connections
- **Timeout settings**: Prevent hanging requests

### Caching (Future)
- Cache results for popular plate numbers
- TTL-based cache invalidation
- Redis integration

## Security Considerations

### Input Validation
- Validate plate number format
- Enum validation for vehicle type
- XSS protection

### Rate Limiting (Recommended)
- Limit requests per IP
- Prevent abuse
- ThrottlerModule integration

### CORS
- Configurable origins
- Secure headers
- Credential handling

## Deployment Strategy

### Docker
- Multi-stage build for smaller image size
- Alpine Linux for minimal footprint
- Health checks for container orchestration

### Scaling
- **Horizontal**: Multiple container instances
- **Load balancing**: Nginx/HAProxy
- **State management**: Stateless design

### Monitoring
- Health endpoints
- Logging with Winston
- Metrics with Prometheus (future)

## Testing Strategy

### Unit Tests
- Service logic testing
- Mock Playwright browser
- DTO validation tests

### Integration Tests
- API endpoint testing
- Database integration (if added)
- Browser interaction tests

### E2E Tests
- Full workflow testing
- Real browser testing
- Performance testing

## Future Enhancements

### 1. Caching Layer
- Redis integration
- Cache popular queries
- Reduce CSGT website load

### 2. Queue System
- Bull/BullMQ for job queue
- Handle high traffic
- Background processing

### 3. Database
- Store historical data
- Analytics
- Rate limiting

### 4. Monitoring
- Prometheus metrics
- Grafana dashboards
- Alert system

### 5. Authentication
- API key authentication
- JWT tokens
- User management

## Technology Stack

- **Framework**: NestJS 10.x
- **Runtime**: Node.js 20.x
- **Browser Automation**: Playwright 1.41.x
- **Language**: TypeScript 5.x
- **Container**: Docker
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

## Development Guidelines

### Code Style
- Follow NestJS conventions
- Use TypeScript strict mode
- Document all public methods
- Write meaningful commit messages

### Module Creation
```bash
nest g module feature-name
nest g service feature-name
nest g controller feature-name
```

### Testing
```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage
```

### Documentation
- Update README when adding features
- Document API changes in Swagger
- Keep architecture docs up-to-date
