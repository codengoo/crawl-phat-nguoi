# API Examples

## Sử dụng cURL

### 1. Tra cứu xe ô tô có vi phạm

```bash
curl -X POST http://localhost:3000/violations/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "30E43807",
    "vehicleType": "car"
  }'
```

### 2. Tra cứu xe máy

```bash
curl -X POST http://localhost:3000/violations/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "51F12345",
    "vehicleType": "motorbike"
  }'
```

### 3. Tra cứu xe đạp điện

```bash
curl -X POST http://localhost:3000/violations/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "29H67890",
    "vehicleType": "electricbike"
  }'
```

### 4. Health check

```bash
curl http://localhost:3000/health
```

### 5. Browser status

```bash
curl http://localhost:3000/health/browser
```

### 6. Restart browser

```bash
curl -X POST http://localhost:3000/health/browser/restart
```

## Sử dụng JavaScript/TypeScript

### Node.js với fetch

```javascript
const lookupViolation = async (plateNumber, vehicleType = 'car') => {
  const response = await fetch('http://localhost:3000/violations/lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plateNumber,
      vehicleType,
    }),
  });

  const data = await response.json();
  return data;
};

// Sử dụng
lookupViolation('30E43807', 'car')
  .then(result => {
    console.log('Success:', result.success);
    console.log('Violations found:', result.data.length);
    console.log('Data:', result.data);
  })
  .catch(error => console.error('Error:', error));
```

### Axios

```javascript
const axios = require('axios');

const lookupViolation = async (plateNumber, vehicleType = 'car') => {
  try {
    const response = await axios.post('http://localhost:3000/violations/lookup', {
      plateNumber,
      vehicleType,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};

// Sử dụng
(async () => {
  const result = await lookupViolation('30E43807', 'car');
  console.log('Violations:', result.data);
})();
```

## Sử dụng Python

### requests library

```python
import requests

def lookup_violation(plate_number, vehicle_type='car'):
    url = 'http://localhost:3000/violations/lookup'
    payload = {
        'plateNumber': plate_number,
        'vehicleType': vehicle_type
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()

# Sử dụng
if __name__ == '__main__':
    result = lookup_violation('30E43807', 'car')
    
    print(f"Success: {result['success']}")
    print(f"Violations found: {len(result['data'])}")
    
    for violation in result['data']:
        print(f"\nPlate: {violation['plateNumber']}")
        print(f"Status: {violation['status']}")
        print(f"Type: {violation['violationDetail']['violationType']}")
        print(f"Time: {violation['violationDetail']['time']}")
        print(f"Location: {violation['violationDetail']['location']}")
```

### aiohttp (async)

```python
import aiohttp
import asyncio

async def lookup_violation(plate_number, vehicle_type='car'):
    url = 'http://localhost:3000/violations/lookup'
    payload = {
        'plateNumber': plate_number,
        'vehicleType': vehicle_type
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            return await response.json()

# Sử dụng
async def main():
    result = await lookup_violation('30E43807', 'car')
    print('Result:', result)

asyncio.run(main())
```

## Sử dụng PHP

```php
<?php

function lookupViolation($plateNumber, $vehicleType = 'car') {
    $url = 'http://localhost:3000/violations/lookup';
    $data = [
        'plateNumber' => $plateNumber,
        'vehicleType' => $vehicleType
    ];
    
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Sử dụng
$result = lookupViolation('30E43807', 'car');

echo "Success: " . ($result['success'] ? 'true' : 'false') . "\n";
echo "Violations found: " . count($result['data']) . "\n";

foreach ($result['data'] as $violation) {
    echo "\nPlate: " . $violation['plateNumber'] . "\n";
    echo "Status: " . $violation['status'] . "\n";
    echo "Type: " . $violation['violationDetail']['violationType'] . "\n";
}
?>
```

## Sử dụng Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

type LookupRequest struct {
    PlateNumber string `json:"plateNumber"`
    VehicleType string `json:"vehicleType"`
}

type ViolationResponse struct {
    Success     bool                   `json:"success"`
    PlateNumber string                 `json:"plateNumber"`
    VehicleType string                 `json:"vehicleType"`
    Data        []map[string]interface{} `json:"data"`
    Error       string                 `json:"error,omitempty"`
}

func lookupViolation(plateNumber, vehicleType string) (*ViolationResponse, error) {
    url := "http://localhost:3000/violations/lookup"
    
    reqBody := LookupRequest{
        PlateNumber: plateNumber,
        VehicleType: vehicleType,
    }
    
    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result ViolationResponse
    err = json.Unmarshal(body, &result)
    if err != nil {
        return nil, err
    }
    
    return &result, nil
}

func main() {
    result, err := lookupViolation("30E43807", "car")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    
    fmt.Printf("Success: %v\n", result.Success)
    fmt.Printf("Violations found: %d\n", len(result.Data))
}
```

## Response Examples

### Có vi phạm

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
        "detectingUnit": "Đội CHGT&ĐK Đèn THGT - Phòng Cảnh sát giao thông",
        "detectingAddress": "Số 54 Trần Hưng Đạo, Phường Cửa Nam, Hà Nội",
        "resolvingUnit": "Đội CSGT ĐB số 6 - Phòng Cảnh sát giao thông",
        "resolvingAddress": "số 2 Phạm Hùng, Phường Từ Liêm, Hà Nội",
        "phone": "02437683373"
      }
    }
  ]
}
```

### Không có vi phạm

```json
{
  "success": true,
  "plateNumber": "30E43807",
  "vehicleType": "car",
  "data": []
}
```

### Validation Error

```json
{
  "statusCode": 400,
  "message": [
    "Biển số xe không đúng định dạng (VD: 30E43807)"
  ],
  "error": "Bad Request"
}
```

### Server Error

```json
{
  "success": false,
  "plateNumber": "30E43807",
  "vehicleType": "car",
  "data": [],
  "error": "page.goto: net::ERR_CONNECTION_RESET"
}
```
