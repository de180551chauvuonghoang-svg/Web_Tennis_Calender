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
                                  [MacroDroid trên Android]
                                  (Tự động mở Zalo & Gửi tin)
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

#### 2. Bộ phận Gửi tin qua Zalo (An toàn & Miễn phí)
Zalo có cơ chế bảo mật chống spam rất nghiêm ngặt, việc tự động hóa gửi tin nhắn ngầm từ API không chính thức dễ bị khóa tài khoản. Có 2 cách tiếp cận miễn phí và an toàn:

*   **Phương án A: Bán tự động (An toàn nhất - Khuyên dùng)**
    *   Khi hệ thống phát hiện học viên muốn liên hệ qua Zalo, Backend sẽ bắn một tin nhắn thông báo vào kênh Discord hiện tại kèm đường link:
        `📋 Liên hệ nhanh Zalo: https://zalo.me/[Số_điện_thoại_học_viên]`
    *   HLV chỉ cần chạm nhẹ vào link trên điện thoại/máy tính → Zalo sẽ tự động mở đúng phòng chat với học viên đó, HLV chỉ cần dán tin nhắn chào mừng đã soạn sẵn.
*   **Phương án B: Tự động hóa 100% bằng MacroDroid (Dành cho điện thoại Android)**
    *   Sử dụng ứng dụng **MacroDroid** (miễn phí) trên điện thoại Android của HLV.
    *   Khi Backend nhận được học viên mới dùng Zalo, nó gửi một webhook đến app MacroDroid.
    *   MacroDroid sẽ tự động thực hiện các thao tác giả lập trên màn hình điện thoại: *Mở Zalo → Tìm kiếm số điện thoại → Dán nội dung chào hỏi → Nhấn Gửi*.

---

### 📋 Kế hoạch triển khai (Sprint 2 Todo):

- [ ] **Bước 1**: Tích hợp thư viện `whatsapp-web.js` vào Express Backend hiện tại.
- [ ] **Bước 2**: Viết code lắng nghe sự kiện từ số điện thoại của Bên thứ 3, thực hiện lọc lấy Số điện thoại học viên mới.
- [ ] **Bước 3**: Tạo mẫu tin nhắn chào mừng động (Dynamic Greeting Message) cấu hình được từ trang Admin.
- [ ] **Bước 4**: Tích hợp luồng gửi:
    *   Gửi tự động qua WhatsApp nếu số học viên hoạt động trên WhatsApp.
    *   Gửi link rút gọn `zalo.me` qua Discord hoặc tự động gửi qua điện thoại HLV.
- [ ] **Bước 5**: Kiểm tra lỗi, tối ưu hóa để tránh bị WhatsApp đánh dấu spam (giới hạn tần suất gửi tin nhắn).
