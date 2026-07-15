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

## 🚀 Hướng dẫn Deploy Backend lên Render & Frontend lên Vercel

Dự án này được thiết kế để chạy độc lập phần Frontend trên Vercel và Backend trên Render nhằm tối ưu hóa hiệu năng tải trang và trải nghiệm người dùng.

### 🛠️ Bước 1: Deploy Backend lên Render
1. Truy cập **[Render.com](https://render.com)** và kết nối tài khoản GitHub của bạn.
2. Chọn repo `Web_Tennis_Calender`.
3. Điền cấu hình Web Service:
   - **Root Directory**: `backend` *(Bắt buộc)*
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Vào tab **Environment** và điền đầy đủ các biến cấu hình từ file `backend/.env`.
5. Bấm **Create Web Service** và sao chép link API nhận được (Ví dụ: `https://web-tennis-calendar-backend.onrender.com`).

### 🛠️ Bước 2: Deploy Frontend lên Vercel
1. Truy cập **[Vercel.com](https://vercel.com)**, liên kết tài khoản GitHub.
2. Bấm **Add New → Project** → Chọn repo `Web_Tennis_Calender` và bấm **Import**.
3. Điền cấu hình:
   - **Root Directory**: `frontend` *(Bắt buộc)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Mở rộng mục **Environment Variables** để thêm biến cấu hình:
   - **Key**: `VITE_API_URL`
   - **Value**: Điền link API Render của bạn kèm `/api` ở cuối (Ví dụ: `https://web-tennis-calendar-backend.onrender.com/api`).
5. Bấm **Deploy**.

---

## ⚡ Mẹo giữ thức Backend Render 24/7 (Tránh Cold Starts)
Vì gói Free của Render sẽ tự động ngủ sau 15 phút không hoạt động:
1. Đăng ký tài khoản miễn phí trên **[UptimeRobot.com](https://uptimerobot.com)**.
2. Thêm mới **HTTP(s) Monitor** trỏ đến link API của bạn trên Render.
3. Cài đặt tần suất (Interval) là **5 phút/lần** để gửi request ping giữ thức liên tục 24/7.
