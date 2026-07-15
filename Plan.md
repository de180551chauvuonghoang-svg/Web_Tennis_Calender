# Kế Hoạch Phát Triển Web Tennis Calendar

## Sprint 1 (Đã hoàn thành)
*   Xây dựng hệ thống đặt lịch học Tennis (React + Express + Supabase).
*   Đăng nhập quản trị viên cho các Huấn luyện viên (HLV).
*   Đồng bộ Google Calendar, ghi nhận Google Sheets và gửi thông báo Discord.
*   Giao diện Dark Mode cao cấp tích hợp bản đồ tọa độ cứng và nút sao chép nhanh.
*   Tối ưu hóa tốc độ tải trang (Pre-warming Backend & Pre-fetching).

---

## Sprint 2 (Kế hoạch tự động hóa CSKH đa kênh)

### 📌 Yêu cầu bài toán:
1.  **Nhận thông tin học viên tự động**: Tự động lắng nghe tin nhắn từ bên thứ 3 gửi đến (qua WhatsApp) chứa số điện thoại học viên mới.
2.  **Tự động gửi tin nhắn chào mừng**: Gửi tin nhắn giới thiệu bản thân & chào hỏi đến học viên.
3.  **Hỗ trợ đa nền tảng**: Tùy chọn gửi tin qua WhatsApp hoặc Zalo theo yêu cầu của học viên.
4.  **Chi phí**: Sử dụng **100% các công nghệ MIỄN PHÍ**.

---

### 💡 Giải Pháp Đề Xuất (100% FREE & Tự Động Hóa)

Vì các giải pháp chính thức như *WhatsApp Business API* và *Zalo Notification Service (ZNS)* đều tính phí theo tin nhắn và yêu cầu xác thực doanh nghiệp phức tạp, ta sẽ áp dụng các giải pháp tự động hóa mã nguồn mở (Self-hosted) miễn phí sau:

```
[Bên thứ 3 gửi SĐT học viên]
            │
            ▼ (Gửi tin WhatsApp đến HLV)
 ┌────────────────────────────────────────────────────────┐
 │           Node.js Backend (whatsapp-web.js)            │
 ├────────────────────────────┬───────────────────────────┤
 │ 1. Tự động nhận tin nhắn   │ 2. Trích xuất SĐT học viên│
 └─────────────┬──────────────┴─────────────┬─────────────┘
               │                            │
               ▼ (Nếu học viên chọn WA)     ▼ (Nếu học viên chọn Zalo)
      [Tự động gửi tin WA]         [Gửi Discord kèm link Zalo]
     client.sendMessage()         https://zalo.me/[SĐT] (HLV chat 1-click)
                                             OR
                                   [Phím tắt iOS / Apple Shortcuts]
                                   (1-Click: Mở Zalo & Copy tin nhắn)
```

---

### 🛠️ CHI TIẾT CÁC THÀNH PHẦN CÔNG NGHỆ:

#### 1. Bộ phận Nhận tin & Gửi tin qua WhatsApp (Hoàn toàn Miễn phí & Tự động)
*   **Công nghệ**: Sử dụng thư viện **`whatsapp-web.js`** hoặc **`Baileys`** (Node.js).
*   **Cơ chế hoạt động**:
    *   Thư viện này giả lập trình duyệt chạy WhatsApp Web ngầm trên Backend.
    *   HLV quét mã QR đăng nhập 1 lần duy nhất trên máy chủ Render/Koyeb.
    *   Khi bên thứ 3 gửi tin nhắn chứa số điện thoại đến WhatsApp của HLV, Backend sẽ tự động bắt sự kiện `message`, dùng biểu thức chính quy (Regex) để trích xuất số điện thoại của học viên.
    *   **Tự động gửi tin nhắn**: Ngay lập tức gọi hàm `client.sendMessage('SĐT_Học_Viên@c.us', 'Tin nhắn chào mừng...')` để gửi tin giới thiệu trực tiếp từ số WhatsApp của HLV đến học viên mà không tốn một đồng phí nào.

#### 2. Bộ phận Gửi tin qua Zalo (An toàn & Miễn phí trên iPhone)
Vì iOS có tính bảo mật sandbox rất cao và bạn đang sử dụng **iPhone**, chúng ta sẽ sử dụng bộ công cụ tích hợp sẵn của Apple để tối ưu quy trình xuống chỉ còn **1-Click**:

*   **Phương án A: Nhấp mở nhanh từ Discord (Đơn giản nhất)**
    *   Khi có học viên chọn Zalo, Backend gửi tin nhắn thông báo vào Discord của bạn kèm link: `https://zalo.me/[Số_điện_thoại]`.
    *   Bạn chỉ cần chạm vào link trên Discord của iPhone → Zalo trên iOS sẽ tự động mở đúng phòng chat với học viên đó để bạn gửi tin nhắn chào mừng.
*   **Phương án B: Sử dụng Phím tắt iOS (Apple Shortcuts) + Thông báo Bark (Tự động hóa 1-Click)**
    *   **Công nghệ**: Sử dụng ứng dụng **Bark** (App nhận thông báo push miễn phí, mã nguồn mở trên App Store) kết hợp ứng dụng **Phím tắt (Shortcuts)** mặc định của iPhone.
    *   **Cơ chế hoạt động**:
        1. Khi Backend nhận được số điện thoại học viên từ bên thứ 3, nó sẽ gửi một push notification đến iPhone của bạn thông qua API của app Bark.
        2. Khi bạn chạm vào thông báo trên màn hình khóa iPhone, nó sẽ kích hoạt một **Phím tắt iOS** tự động:
            *   Tự động sao chép (Copy) nội dung tin nhắn chào mừng vào bộ nhớ tạm (Clipboard).
            *   Tự động mở ứng dụng Zalo trỏ thẳng đến số điện thoại học viên qua URL Scheme: `zalo://chat?phone=[SĐT]`.
        3. Bạn chỉ cần chạm giữ vào khung chat Zalo → chọn **Dán (Paste)** → Nhấn **Gửi**. Quy trình cực kỳ nhanh gọn và tuyệt đối an toàn.

---

## ⚡ LUỒNG TỐI ƯU HÓA HOÀN TOÀN MỚI (SPRINT 2)

Hệ thống sẽ hoạt động khép kín và tự động 100% qua các cổng kết nối API và AI hoàn toàn miễn phí. HLV có thể làm việc mọi lúc trên di động mà không cần mở website.

### 📐 Kiến trúc Luồng mới

```
[Bên thứ 3 gửi tin nhắn SĐT]
             │
             ▼
┌───────────────────────────┐
│      Express Backend      │
├───────────────────────────┤
│ 1. Trích xuất SĐT học viên│
│ 2. Tự động gửi tin chào WA│
│ 3. Gọi Groq AI parse info │◄───► [Lưu database leads (Supabase)]
│ 4. Đổi status: 'Contacted'│
└───────────────────────────┘
             │
    (HLV chốt lịch tập xong)
             │
             ▼ (Nhắn tin chat tự do vào Discord)
  "Nguyễn Văn A tập lúc 3h30pm thời gian tập 1h sân victoria"
             │
             ▼
┌───────────────────────────┐
│     Discord Bot (Free)    │
├───────────────────────────┤
│ 1. Lắng nghe tin nhắn HLV  │
│ 2. Gọi Groq AI parse lịch │
│ 3. Tạo Google Calendar    │
│ 4. Lưu Supabase & Sheets  │
│ 5. Trả kết quả về Discord │
└───────────────────────────┘
```

---

### 🛠️ CHI TIẾT CƠ CHẾ VẬN HÀNH:

#### 1. Lắng nghe Bên Thứ 3 ⟷ Tự Động Kết Bạn & Gửi Chào Hỏi ⟷ Tự Động Ghi Nhận
*   **Bước 1**: Thư viện WhatsApp Web (chạy ngầm ở Backend) lắng nghe tin nhắn từ bên thứ 3.
*   **Bước 2**: Khi phát hiện tin nhắn chứa số điện thoại học viên, Backend tự động:
    *   Gửi tin nhắn chào mừng đã soạn sẵn sang số WhatsApp của học viên.
    *   Gọi **Groq AI** để phân tích đoạn text tin nhắn nhận được từ bên thứ 3 (Ví dụ: *"Học viên Nguyễn Văn A, 28 tuổi, số điện thoại 090..., muốn học cơ bản"*). AI sẽ tự bóc tách ra: `{ name: "Nguyễn Văn A", age: 28, phone: "090...", level: "Basic" }` mà không cần HLV nhập tay.
    *   Lưu thông tin vừa trích xuất vào bảng `leads` trong cơ sở dữ liệu Supabase.
    *   Cập nhật trạng thái (`status`) của học viên này là **`Contacted`** (Đã liên hệ).

#### 2. Lên Lịch Tập Tự Động Bằng Trí Tuệ Nhân Tạo (Qua Discord Bot)
*   **Bước 1**: Tạo một **Discord Bot** miễn phí (sử dụng thư viện `discord.js` tích hợp ở Backend). Bot sẽ tham gia vào kênh Discord chat chung của các HLV.
*   **Bước 2**: Khi HLV nhắn tin chốt lịch có cấu trúc tự nhiên, ví dụ:
    > *"Nguyễn Văn A tập lúc 3h30pm thời gian tập 1h sân victoria"*
*   **Bước 3**: Bot Discord sẽ bắt tin nhắn này và gửi nội dung sang **Groq API** để dịch ngôn ngữ tự nhiên thành dữ liệu cấu trúc:
    ```json
    {
      "studentName": "Nguyễn Văn A",
      "startTime": "2026-07-15T15:30:00", // Tự quy đổi múi giờ & ngày hiện tại
      "duration": 60,                     // 1h = 60 phút
      "court": "Sân Victoria resort"      // Tự ánh xạ sang tên sân chuẩn
    }
    ```
*   **Bước 4**: Backend chạy tự động quy trình lên lịch:
    1. Tra cứu học viên `Nguyễn Văn A` trong bảng `leads`.
    2. Tạo sự kiện trên **Google Calendar**.
    3. Ghi nhận đối soát trên **Google Sheets**.
    4. Thêm bản ghi vào bảng `lessons` (Supabase).
*   **Bước 5**: Bot Discord phản hồi ngay lập tức bằng tin nhắn:
    > *“✅ Đã lên lịch thành công cho học viên **Nguyễn Văn A** tập vào lúc **15:30 ngày 15/07/2026** tại **Sân Victoria resort**. Lịch đã được đồng bộ lên Google Calendar và Google Sheets!”*

---

### 📋 Kế Hoạch Triển Khai (Sprint 2 Todo):

- [ ] **Bước 1**: Tích hợp và cấu hình thư viện `whatsapp-web.js` ở Backend để tự động nhận tin/gửi tin WhatsApp.
- [ ] **Bước 2**: Viết module **AI Parser** kết nối Groq API để phân tích tin nhắn bên thứ 3 và tự động tạo lead, đổi trạng thái sang `Contacted`.
- [ ] **Bước 3**: Thiết lập **Discord Bot** (đăng ký token ứng dụng trên Discord Developer Portal).
- [ ] **Bước 4**: Viết module xử lý tin nhắn của HLV trên Discord bằng Groq API để phân tích cú pháp đặt lịch tự do và thực thi quy trình lên lịch tự động.
- [ ] **Bước 5**: Kiểm tra chạy thử thực tế và tối ưu hóa phản hồi.
