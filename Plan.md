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

### 📋 Kế hoạch triển khai (Sprint 2 Todo):

- [ ] **Bước 1**: Tích hợp thư viện `whatsapp-web.js` vào Express Backend hiện tại.
- [ ] **Bước 2**: Viết code lắng nghe sự kiện từ số điện thoại của Bên thứ 3, thực hiện lọc lấy Số điện thoại học viên mới.
- [ ] **Bước 3**: Tạo mẫu tin nhắn chào mừng động (Dynamic Greeting Message) cấu hình được từ trang Admin.
- [ ] **Bước 4**: Tích hợp luồng gửi:
    *   Gửi tự động qua WhatsApp nếu số học viên hoạt động trên WhatsApp.
    *   Gửi link rút gọn `zalo.me` qua Discord hoặc tự động gửi qua điện thoại HLV.
- [ ] **Bước 5**: Kiểm tra lỗi, tối ưu hóa để tránh bị WhatsApp đánh dấu spam (giới hạn tần suất gửi tin nhắn).
