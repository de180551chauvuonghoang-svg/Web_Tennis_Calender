# 🎾 Web Tennis Calendar (Tennis AI Sales & Scheduling Assistant)

Hệ thống quản lý, phân tích thông tin học viên đăng ký học thử và tự động lên lịch tập Tennis thông minh. Ứng dụng đồng bộ dữ liệu đa kênh thời gian thực (Supabase, Google Sheets, Google Calendar, Discord Webhook) kết hợp Trí tuệ nhân tạo (AI OCR) phục vụ đắc lực cho các Huấn luyện viên và Câu lạc bộ Tennis.

---

## 🎯 Tổng Quan Hệ Thống

Ứng dụng giúp đơn giản hóa quy trình chăm sóc khách hàng và lên lịch dạy của Huấn luyện viên (HLV). Từ việc tiếp nhận thông tin học viên mới, trích xuất dữ liệu tự động bằng AI, lên lịch trên Google Calendar, lưu trữ đối soát trên Google Sheets, cho đến gửi thông báo nhắc lịch tự động qua Discord trước giờ tập.

### 📐 Sơ đồ luồng hoạt động (Data Flow)

```
[Khách hàng đăng ký] ──┐
                        ▼
                  ┌───────────┐      ┌──────────────┐      ┌─────────────────┐
                  │ Frontend  ├─────►│  Supabase DB │◄────►│  Google Sheets  │
                  │  (Vercel) │      └──────┬───────┘      └─────────────────┘
                  └─────▲─────┘             │
                        │                   ▼
                  ┌─────┴─────┐      ┌──────────────┐      ┌─────────────────┐
                  │  Express  ├─────►│ Google Cal   ├─────►│ Discord Webhook │
                  │  (Render) │      └──────────────┘      └─────────────────┘
                  └─────▲─────┘
                        │ (OCR trích xuất ảnh)
                  [Groq AI Vision]
```

---

## ✨ Các Tính Năng Nổi Bật

### 1. Giao Diện Tối Giản, Hiện Đại (Premium UX/UI)
*   Thiết kế giao diện Dark Mode thời thượng với các dải màu chuyển sắc (Gradients) và viền phát sáng neon (Glow effect).
*   Responsive hoàn hảo trên mọi thiết bị: PC, Laptop, Máy tính bảng và Điện thoại di động.
*   Logo tùy chỉnh phát sáng trên Header và Icon tab trình duyệt (Favicon) trong suốt cao cấp.

### 2. Trích Xuất Thông Tin Bằng AI (OCR Vision)
*   HLV chỉ cần chụp ảnh màn hình đoạn chat (Zalo/WhatsApp) của học viên rồi nhấn **Ctrl + V** (hoặc tải ảnh lên) tại Dashboard.
*   Hệ thống sử dụng **Groq Vision API (Llama 3)** để phân tích hình ảnh và tự động trích xuất: Họ tên, số điện thoại, trình độ, nền tảng liên hệ và ghi chú điền thẳng vào form đặt lịch chỉ trong 1-2 giây.

### 3. Đồng Bộ Google Calendar Thông Minh
*   Tự động tạo sự kiện trên lịch Google Calendar khi HLV xác nhận lịch tập.
*   **Quản lý trạng thái trực quan**:
    *   *Hoàn thành buổi học*: Chuyển lịch sang màu xanh lá đặc trưng, làm mờ lịch và gạch ngang chữ để dễ nhận biết.
    *   *Hủy lịch*: Xóa sự kiện khỏi Google Calendar và đưa trạng thái về hủy riêng biệt giúp quản lý chính xác.

### 4. Định Vị Sân Tập & Bản Đồ Tích Hợp
*   Hỗ trợ gán cứng tọa độ định vị GPS chính xác cho các sân tập:
    *   **Sân 1 (Hào Anh tennis Coffee)**: `Tennis & Coffee Hào Anh Hội An, V8JV+W45, Lý Thường Kiệt, Hội An Đông, Đà Nẵng, Vietnam` (Tọa độ: `15.8818113, 108.3403445`).
    *   **Sân 2 (Sân Victoria resort)**: `V9W9+8GM Hoi An Dong, Da Nang, Vietnam`.
*   Form đặt lịch hỗ trợ xem vị trí trên Google Maps và **sao chép nhanh địa chỉ đầy đủ** chỉ với 1 cú click.

### 5. Hệ Thống Thông Báo & Nhắc Lịch Discord (Cron Job)
*   **Thông báo lên lịch thành công**: Gửi ngay lập tức thông tin chi tiết của học viên, sân tập, bản đồ Google Maps và **địa chỉ đầy đủ định dạng code block** vào Discord để HLV dễ dàng sao chép gửi cho khách hàng.
*   **Nhắc lịch tập tự động**: Quét cơ sở dữ liệu ngầm và gửi nhắc nhở riêng biệt trước giờ tập **30 phút** qua kênh Discord để HLV kịp chuẩn bị sân bãi và dụng cụ.

---

## 💻 Công Nghệ Sử Dụng

*   **Frontend**: React (Typescript), Vite, Lucide Icons, Vanilla CSS (Tối ưu hóa tốc độ tải trang).
*   **Backend**: Node.js, Express, Typescript, Node-cron (Quản lý tiến trình ngầm).
*   **Cơ sở dữ liệu**: Supabase (PostgreSQL) - Quản lý dữ liệu học viên và buổi học.
*   **AI**: Groq SDK (Llama 3 Vision Model).
*   **APIs**: Google Calendar API, Google Sheets API, Discord Webhook.

---

## 🛠️ Cài Đặt và Khởi Chạy Local

### 1. Cài đặt các thư viện
Tại thư mục gốc dự án, chạy lệnh:
```bash
npm run install:all
```

### 2. Cấu hình biến môi trường
Tạo file `backend/.env` và điền đầy đủ các thông số sau:
```env
PORT=3001
SUPABASE_URL=...
SUPABASE_KEY=...
GROQ_API_KEY=...
GOOGLE_CALENDAR_ID=...
GOOGLE_SHEETS_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY="..."
DISCORD_WEBHOOK_URL=...
ADMIN_PASSWORD=...
```

### 3. Chạy dự án ở chế độ Development
Chạy lệnh sau để khởi chạy song song cả Frontend & Backend:
```bash
npm run dev
```
*   Frontend chạy tại: `http://localhost:5173`
*   Backend chạy tại: `http://localhost:3001`

---

## 🚀 Hướng dẫn Deploy lên Production (Tối ưu & Miễn phí)

Hệ thống được deploy tách biệt để đảm bảo hiệu suất tối đa:

### 1. Deploy Backend lên Render (Miễn phí)
*   **Root Directory**: `backend` *(Bắt buộc)*
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm start`
*   **Environment Variables**: Sao chép toàn bộ các biến từ file `.env` vào mục Environment trên Render.
*   **Giữ thức 24/7**: Sử dụng dịch vụ miễn phí **[UptimeRobot](https://uptimerobot.com)** tạo monitor ping vào URL Render của bạn mỗi **5 phút** một lần để tránh server đi ngủ.

### 2. Deploy Frontend lên Vercel (Miễn phí)
*   **Root Directory**: `frontend` *(Bắt buộc)*
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variables**: Thêm biến `VITE_API_URL` trỏ tới URL API Render của bạn (Ví dụ: `https://ten-backend.onrender.com/api`).
