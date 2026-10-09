export interface ReminderItem {
  category: string;
  title: string;
  description: string;
  count?: number | string;
  urgency: "HIGH" | "MEDIUM" | "INFO";
  dueDate?: string;
  isDueDateApproaching?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface DigestEmailData {
  picName: string;
  picRole: string;
  menuTitle: string;
  reportDate: string;
  summaryStats: { label: string; value: string | number }[];
  reminders: ReminderItem[];
}

export function generateDigestHtml(data: DigestEmailData): string {
  const urgencyColors = {
    HIGH: { bg: "#FEF2F2", text: "#991B1B", border: "#F87171", badge: "MENDESAK" },
    MEDIUM: { bg: "#FFFBEB", text: "#92400E", border: "#FBBF24", badge: "PERHATIAN" },
    INFO: { bg: "#EFF6FF", text: "#1E40AF", border: "#60A5FA", badge: "INFO" },
  };

  const statCards = data.summaryStats
    .map(
      (s) => `
      <td style="padding: 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center; width: 33%;">
        <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">${s.label}</div>
        <div style="font-size: 20px; font-weight: 700; color: #0F172A; margin-top: 4px;">${s.value}</div>
      </td>
    `
    )
    .join("<td style='width: 12px;'></td>");

  const reminderRows = data.reminders
    .map((item) => {
      const u = urgencyColors[item.urgency] || urgencyColors.INFO;
      return `
      <div style="margin-bottom: 14px; border: 1px solid ${u.border}; background-color: ${u.bg}; border-radius: 8px; padding: 14px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background-color: #FFFFFF; color: ${u.text}; border: 1px solid ${u.border};">
              ${u.badge} • ${item.category}
            </span>
            ${
              item.dueDate
                ? `<span style="display: inline-block; margin-left: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background-color: #0F172A; color: #FFFFFF;">
                    ⏱️ Due: ${item.dueDate}
                  </span>`
                : ""
            }
          </div>
          ${item.count ? `<span style="font-size: 13px; font-weight: 700; color: ${u.text}; float: right;">${item.count}</span>` : ""}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 6px;">${item.title}</div>
        <div style="font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.5;">${item.description}</div>
        ${
          item.actionUrl
            ? `<div style="margin-top: 10px;">
                <a href="${item.actionUrl}" style="display: inline-block; font-size: 12px; font-weight: 600; color: #FFFFFF; background-color: #0284C7; padding: 6px 12px; border-radius: 6px; text-decoration: none;">
                  ${item.actionText || "Buka di Harmoni →"}
                </a>
               </div>`
            : ""
        }
      </div>
    `;
    })
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${data.menuTitle} - Daily Digest Harmoni</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #E2E8F0;">
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #0B2545 0%, #134E5E 100%); padding: 24px 28px; color: #FFFFFF;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #38BDF8; text-transform: uppercase;">HARMONI • PT BERAU COAL</div>
                <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-top: 4px;">${data.menuTitle} Digest</div>
                <div style="font-size: 13px; color: #CBD5E1; margin-top: 4px;">Laporan & Rekap Reminder Tindakan Otomatis</div>
              </td>
              <td align="right" valign="top">
                <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; background-color: rgba(255,255,255,0.15); border-radius: 20px; color: #F8FAFC;">
                  ${data.reportDate}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding: 24px 28px;">
          <!-- Greeting -->
          <div style="font-size: 15px; color: #1E293B; line-height: 1.6;">
            Halo <strong>${data.picName}</strong> (${data.picRole}),
          </div>
          <div style="font-size: 13px; color: #64748B; margin-top: 4px; line-height: 1.5;">
            Berikut adalah rekap ringkasan dan daftar poin penting yang memerlukan perhatian/tindakan Anda di modul <strong>${data.menuTitle}</strong> per hari ini:
          </div>

          <!-- Stats Overview -->
          <div style="margin: 20px 0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                ${statCards}
              </tr>
            </table>
          </div>

          <!-- Section Title -->
          <div style="font-size: 14px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E2E8F0;">
            📌 Daftar Reminder & Tindakan Dibutuhkan
          </div>

          <!-- Reminders List -->
          <div>
            ${reminderRows}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${process.env.APP_BASE_URL || "https://harmoni.beraucoal.co.id"}" style="display: inline-block; background-color: #0B2545; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(11, 37, 69, 0.2);">
              Buka Dashboard Harmoni
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #64748B; line-height: 1.5;">
          Email ini dikirimkan secara otomatis oleh <strong>Harmoni System (Berau Coal HR Digital)</strong>.<br/>
          Akses portal: <a href="https://harmoni.beraucoal.co.id" style="color: #0284C7; text-decoration: none;">https://harmoni.beraucoal.co.id</a>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

