import { chromium } from 'playwright';

/**
 * Script debug để kiểm tra cấu trúc HTML của trang CSGT
 */

async function debugPage() {
  console.log('Đang khởi động browser để debug...\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('Đang truy cập trang...');
    await page.goto('https://www.csgt.vn/tra-cuu-phat-nguoi', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✓ Trang đã load xong!\n');

    // Đợi thêm để trang load hoàn toàn
    await page.waitForTimeout(3000);

    // Lấy HTML của form
    console.log('=== HTML của trang ===\n');
    const html = await page.content();
    
    // Tìm các input fields
    console.log('=== Tìm các input fields ===\n');
    const inputs = await page.$$eval('input', elements => 
      elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        class: el.className,
        placeholder: el.placeholder
      }))
    );
    console.log('Inputs tìm thấy:', JSON.stringify(inputs, null, 2));

    // Tìm các select/dropdown
    console.log('\n=== Tìm các select/dropdown ===\n');
    const selects = await page.$$eval('select', elements =>
      elements.map(el => ({
        name: el.name,
        id: el.id,
        class: el.className,
        options: Array.from(el.options).map((opt: any) => ({
          value: opt.value,
          text: opt.text
        }))
      }))
    );
    console.log('Selects tìm thấy:', JSON.stringify(selects, null, 2));

    // Tìm các button
    console.log('\n=== Tìm các button ===\n');
    const buttons = await page.$$eval('button, input[type="submit"]', elements =>
      elements.map(el => ({
        type: el.type,
        text: el.textContent?.trim() || el.value,
        class: el.className,
        id: el.id
      }))
    );
    console.log('Buttons tìm thấy:', JSON.stringify(buttons, null, 2));

    // Lưu HTML vào file
    const fs = require('fs');
    fs.writeFileSync('debug_page.html', html);
    console.log('\n✓ HTML đã lưu vào file debug_page.html');

    // Chụp screenshot
    await page.screenshot({ path: 'debug_screenshot.png', fullPage: true });
    console.log('✓ Screenshot đã lưu vào debug_screenshot.png');

    console.log('\n⏸️  Browser sẽ mở 30 giây để bạn xem. Bấm Ctrl+C để đóng sớm.');
    await page.waitForTimeout(30000);

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await browser.close();
    console.log('\n✓ Hoàn tất!');
  }
}

debugPage();
