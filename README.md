# 🎾 Web Tennis Calendar

Hệ thống quản lý thông tin học viên đăng ký học thử và tự động lên lịch tập Tennis, đồng bộ dữ liệu đa kênh (Supabase, Google Sheets, Google Calendar, Discord Webhook).

## 🚀 Hướng dẫn chạy môi trường Local (Development)

1. Cài đặt toàn bộ dependencies ở cả thư mục root:
   ```bash
   npm run install:all
   ```
2. Cấu hình file `.env` trong thư mục `backend/.env` với đầy đủ thông tin khóa API cần thiết.
3. Chạy chế độ phát triển đồng thời cả frontend & backend:
   ```bash
   npm run dev
   ```

---

## 🚀 Hướng dẫn Deploy lên Production (Render / Node.js Host)

Dự án đã được cấu hình theo mô hình **Monolith** tối ưu nhất, cả Frontend và Backend sẽ được đóng gói chung và chạy trên duy nhất 1 Web Service để tiết kiệm chi phí và tránh lỗi CORS.

### Bước 1: Tạo Web Service mới trên Render
1. Truy cập **Render.com**, kết nối tài khoản GitHub của bạn.
2. Chọn repo `Web_Tennis_Calender`.
3. Điền cấu hình:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Bước 2: Điền các biến cấu hình (Environment Variables)
Sao chép các biến cấu hình từ `backend/.env` sang phần cấu hình Environment trên Render:
- `SUPABASE_URL`, `SUPABASE_KEY`
- `GROQ_API_KEY`
- `GOOGLE_CALENDAR_ID`, `GOOGLE_SHEETS_ID`
- `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (bỏ dấu nháy kép ở đầu và cuối key)
- `DISCORD_WEBHOOK_URL`
- `ADMIN_PASSWORD` (mật khẩu trang quản trị)

### Bước 3: Hoàn tất
Bấm **Create Web Service**. Khi Render build hoàn tất, dự án của bạn sẽ hoạt động hoàn toàn tự động trực tuyến và đồng bộ đa kênh!
