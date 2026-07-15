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

## 🚀 Hướng dẫn Deploy lên Production Hoàn toàn Miễn phí 24/7

Dự án đã được cấu hình theo mô hình **Monolith** tối ưu nhất, cả Frontend và Backend sẽ được đóng gói chung và chạy trên duy nhất 1 Web Service để tiết kiệm chi phí và tránh lỗi CORS.

### 🛠️ CÁCH 1: Sử dụng Koyeb (Không bị ngủ - Khuyên dùng)
*Koyeb cung cấp instance Nano 24/7 hoàn toàn miễn phí và không bị ngủ như Render.*

1. Truy cập **[koyeb.com](https://www.koyeb.com)** và đăng nhập bằng tài khoản GitHub.
2. Chọn **Create Service** → Kết nối repo `Web_Tennis_Calender`.
3. Điền cấu hình:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Instance Type**: `Nano` (Free tier)
   - **Port**: `8000` (mặc định)
4. Vào phần **Environment Variables** để điền đầy đủ các biến cấu hình tương tự file `backend/.env`.
5. Bấm **Deploy**. Sau 1-2 phút, dự án sẽ hoạt động và có link public 24/7.

### 🛠️ CÁCH 2: Render (Free) + UptimeRobot (Giữ thức 24/7)
*Render miễn phí hoàn toàn nhưng sẽ ngủ sau 15 phút. Chúng ta dùng UptimeRobot để ping giữ thức.*

1. Tạo **Web Service** trên **[Render.com](https://render.com)** liên kết với repo GitHub.
2. Cấu hình:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
3. Điền các biến cấu hình tại tab **Environment** và bấm **Create Web Service**. Chờ nhận link (ví dụ: `https://web-tennis.onrender.com`).
4. Truy cập **[uptimerobot.com](https://uptimerobot.com)** (miễn phí), bấm **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **URL**: Điền link Render của bạn.
   - **Interval**: `5 minutes` (ping mỗi 5 phút một lần để giữ server luôn thức).
