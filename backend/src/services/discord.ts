import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';

if (!discordWebhookUrl) {
  console.error('[Discord Webhook] Thiếu DISCORD_WEBHOOK_URL trong cấu hình.');
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number; // Decimal color code
  fields: DiscordEmbedField[];
  footer: {
    text: string;
  };
  timestamp?: string;
}

/**
 * Định dạng thời gian sang dạng HH:mm DD/MM/YYYY
 */
export function formatVietnameseDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch (error) {
    return dateStr;
  }
}

/**
 * Tính toán khoảng cách phút giữa 2 mốc thời gian
 */
export function calculateDurationMinutes(startStr: string, endStr: string): number {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / 60000);
  } catch (error) {
    return 0;
  }
}

/**
 * Gửi webhook đến Discord
 */
async function sendDiscordWebhook(embeds: DiscordEmbed[]): Promise<void> {
  if (!discordWebhookUrl) {
    console.error('[Discord Webhook] Không có URL webhook cấu hình.');
    return;
  }

  try {
    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds }),
    });

    if (!response.ok) {
      console.error('[Discord Webhook] Phản hồi lỗi từ Discord:', response.statusText);
    } else {
      console.log('[Discord Webhook] Gửi thông báo đến Discord thành công.');
    }
  } catch (error) {
    console.error('[Discord Webhook] Lỗi khi gửi webhook:', error);
  }
}

interface LessonNotificationDetails {
  studentName: string;
  phone: string;
  platform: string;
  coachName: string;
  startTime: string;
  endTime: string;
  notes?: string;
  court?: string;
  mapsLink?: string;
}

/**
 * Gửi thông báo đặt lịch học mới thành công
 */
export async function sendDiscordBookingNotification(details: LessonNotificationDetails): Promise<void> {
  const duration = calculateDurationMinutes(details.startTime, details.endTime);
  const formattedStart = formatVietnameseDateTime(details.startTime);
  const formattedEnd = formatVietnameseDateTime(details.endTime);
  
  const embed: DiscordEmbed = {
    title: '🎾 THÔNG BÁO LÊN LỊCH TẬP TENNIS THÀNH CÔNG',
    description: `🔔 Buổi tập của học viên **${details.studentName}** đã được huấn luyện viên **${details.coachName}** lên lịch thành công!`,
    color: 12779284, // Màu lục Tennis #C2FF14
    fields: [
      { name: '👤 Học viên', value: details.studentName, inline: true },
      { name: '📞 Số điện thoại', value: details.phone, inline: true },
      { name: '📘 Nền tảng liên hệ', value: details.platform || 'Zalo', inline: true },
      { name: '⏰ Thời gian bắt đầu', value: formattedStart, inline: true },
      { name: '⏰ Thời gian kết thúc', value: formattedEnd, inline: true },
      { name: '⏱️ Thời lượng', value: `${duration} phút`, inline: true },
      { name: '📍 Địa điểm / Sân tập', value: details.court || 'Chưa xác định', inline: true },
      { name: '🗺️ Bản đồ Google Maps', value: details.mapsLink ? `[Bấm để mở Bản đồ](${details.mapsLink})` : 'Không có', inline: true },
      { name: '📝 Ghi chú lịch dạy', value: details.notes || 'Không có ghi chú', inline: false }
    ],
    footer: {
      text: `Tennis AI Sales Assistant - Tạo lịch tự động • ${formatVietnameseDateTime(new Date().toISOString())}`
    }
  };

  await sendDiscordWebhook([embed]);
}

/**
 * Gửi thông báo nhắc lịch học sắp diễn ra (trước 30 phút)
 */
export async function sendDiscordReminderNotification(details: LessonNotificationDetails): Promise<void> {
  const duration = calculateDurationMinutes(details.startTime, details.endTime);
  const formattedStart = formatVietnameseDateTime(details.startTime);

  const embed: DiscordEmbed = {
    title: '⏰ [REMINDER] BUỔI TẬP TENNIS SẮP BẮT ĐẦU',
    description: `⚠️ Huấn luyện viên **${details.coachName}** lưu ý sân bãi và dụng cụ! Buổi học thử của học viên **${details.studentName}** sẽ diễn ra sau **30 phút** nữa.`,
    color: 16347926, // Màu cam cảnh báo #F97316
    fields: [
      { name: '👤 Học viên', value: details.studentName, inline: true },
      { name: '⏰ Thời gian bắt đầu', value: formattedStart, inline: true },
      { name: '⏱️ Thời lượng tập', value: `${duration} phút`, inline: true },
      { name: '📍 Sân tập', value: details.court || 'Chưa xác định', inline: true },
      { name: '🗺️ Bản đồ Google Maps', value: details.mapsLink ? `[Bấm để mở Bản đồ](${details.mapsLink})` : 'Không có', inline: true },
      { name: '📞 Liên hệ nhanh', value: `${details.platform || 'Zalo'}: ${details.phone}`, inline: false },
      { name: '📝 Ghi chú cần lưu ý', value: details.notes || 'Không có ghi chú', inline: false }
    ],
    footer: {
      text: `Hệ thống nhắc lịch tự động Web Tennis Calendar • ${formatVietnameseDateTime(new Date().toISOString())}`
    }
  };

  await sendDiscordWebhook([embed]);
}
