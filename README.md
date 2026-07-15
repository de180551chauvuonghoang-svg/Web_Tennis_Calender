# 🎾 Web Tennis Calendar

Hệ thống quản lý thông tin học viên đăng ký học thử và tự động lên lịch tập Tennis, đồng bộ dữ liệu đa kênh (Supabase, Google Sheets, Google Calendar, Discord Webhook).

## 🚀 Hướng dẫn chạy môi trường Local (Development)

1. Cài đặt toàn bộ dependencies ở thư mục root:
   ```bash
   npm run install:all
   ```
2. Cấu hình file `.env` trong thư mục `backend/.env` với đầy đủ thông tin khóa API cần thiết.
3. Chạy chế độ phát triển đồng thời cả frontend & backend:
   ```bash
   npm run dev
   ```

---

## 🚀 Hướng dẫn Deploy lên Production (Railway / Render)

Dự án đã được cấu hình theo mô hình **Monolith** tối ưu nhất, cả Frontend và Backend sẽ được đóng gói chung và chạy trên duy nhất 1 Web Service để tiết kiệm chi phí và tránh lỗi CORS.

### 🛠️ CÁCH 1: Deploy lên Railway (Khuyên dùng)
*Railway rất tốt vì gói Hobby không bị cơ chế "ngủ" như Render, giúp tải trang ngay lập tức.*

1. Truy cập **[railway.app](https://railway.app)** và đăng nhập bằng tài khoản GitHub.
2. Chọn **New Project** → **Deploy from GitHub repo** → Chọn repo `Web_Tennis_Calender`.
3. Bấm **Deploy Now**.
4. Vào tab **Variables** và điền đầy đủ các biến cấu hình từ file `backend/.env`.
5. Vào tab **Settings** → phần **Networking** → Bấm **Generate Domain** để lấy đường link truy cập công khai.

### 🛠️ CÁCH 2: Deploy lên Render (Miễn phí)
1. Truy cập **[Render.com](https://render.com)**, kết nối tài khoản GitHub của bạn.
2. Chọn repo `Web_Tennis_Calender`.
3. Điền cấu hình:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Vào tab **Environment** và điền đầy đủ các biến cấu hình tương tự file `backend/.env`.
5. Bấm **Create Web Service**.
