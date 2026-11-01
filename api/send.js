export const config = {
  runtime: "nodejs"
};

function clean(value, max = 500) {
  return String(value ?? "Not Available")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({
      success: false,
      message: "BOT_TOKEN atau CHAT_ID belum disetel"
    });
  }

  try {
    const data = req.body || {};

    const os = clean(data.os);
    const platform = clean(data.platform);
    const cpu = clean(data.cpu);
    const ram = clean(data.ram);
    const resolution = clean(data.resolution);
    const browser = clean(data.browser);
    const timezone = clean(data.timezone);
    const language = clean(data.language);

    const now = new Date();

    const date = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full"
    }).format(now);

    const time = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      timeStyle: "medium"
    }).format(now);

    const message = `
🚨 ERROR 503 REPORT

━━━━━━━━━━━━━━━━━━━━
📱 DEVICE INFORMATION
━━━━━━━━━━━━━━━━━━━━
OS              : ${os}
Platform        : ${platform}
CPU Cores       : ${cpu}
RAM             : ${ram}
Resolution      : ${resolution}
Browser         : ${browser}
Timezone        : ${timezone}
Language        : ${language}

━━━━━━━━━━━━━━━━━━━━
📍 LOCATION INFORMATION
━━━━━━━━━━━━━━━━━━━━
Location        : Not Forwarded

━━━━━━━━━━━━━━━━━━━━
⚠️ ERROR INFORMATION
━━━━━━━━━━━━━━━━━━━━
Error Code      : 503
Message         : Service Unavailable
Action          : Retry

━━━━━━━━━━━━━━━━━━━━
⏰ TIME INFORMATION
━━━━━━━━━━━━━━━━━━━━
Date            : ${date}
Time            : ${time}

━━━━━━━━━━━━━━━━━━━━
✅ END OF REPORT
`;

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return res.status(502).json({
        success: false,
        message: "Telegram gagal mengirim laporan"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report sent"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}
