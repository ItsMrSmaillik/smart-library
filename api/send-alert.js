
export default async function handler(req, res) {
    // Разрешаем только POST-запросы
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const appId = process.env.ONESIGNAL_APP_ID;
        const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
        const deviceToken = process.env.DEVICE_TOKEN;

        // Проверяем настройки Vercel
        if (!appId || !restApiKey || !deviceToken) {
            console.error("Missing environment variables");

            return res.status(500).json({
                success: false,
                error: "Server configuration error"
            });
        }

        // Проверяем токен устройства
        const receivedToken = req.headers["x-device-token"];

        if (receivedToken !== deviceToken) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        const { type, temperature, humidity, language = "ru" } = req.body || {};

        // Поддерживаемые языки
        const translations = {
            ru: {
                title: "⚠️ Smart Library",
                tempLow: "Температура слишком низкая!",
                tempHigh: "Температура слишком высокая!",
                humidityLow: "Влажность слишком низкая!",
                humidityHigh: "Влажность слишком высокая!",
                tempNormal: "Температура вернулась в норму!",
                humidityNormal: "Влажность вернулась в норму!"
            },
            ro: {
                title: "⚠️ Smart Library",
                tempLow: "Temperatura este prea scăzută!",
                tempHigh: "Temperatura este prea ridicată!",
                humidityLow: "Umiditatea este prea scăzută!",
                humidityHigh: "Umiditatea este prea ridicată!",
                tempNormal: "Temperatura a revenit la normal!",
                humidityNormal: "Umiditatea a revenit la normal!"
            },
            en: {
                title: "⚠️ Smart Library",
                tempLow: "Temperature is too low!",
                tempHigh: "Temperature is too high!",
                humidityLow: "Humidity is too low!",
                humidityHigh: "Humidity is too high!",
                tempNormal: "Temperature returned to normal!",
                humidityNormal: "Humidity returned to normal!"
            }
        };

        const lang = translations[language] ? language : "ru";
        const t = translations[lang];

        let message;

        switch (type) {
            case "temp_low":
                message = `${t.tempLow} ${temperature} °C`;
                break;

            case "temp_high":
                message = `${t.tempHigh} ${temperature} °C`;
                break;

            case "humidity_low":
                message = `${t.humidityLow} ${humidity} %`;
                break;

            case "humidity_high":
                message = `${t.humidityHigh} ${humidity} %`;
                break;

            case "temp_normal":
                message = `${t.tempNormal} ${temperature} °C`;
                break;

            case "humidity_normal":
                message = `${t.humidityNormal} ${humidity} %`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: "Unknown alert type"
                });
        }

        // Отправляем Push через OneSignal
        const response = await fetch(
            "https://api.onesignal.com/notifications",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Key ${restApiKey}`
                },
                body: JSON.stringify({
                    app_id: appId,
                    included_segments: ["All"],
                    headings: {
                        en: t.title
                    },
                    contents: {
                        en: message
                    }
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("OneSignal error:", result);

            return res.status(502).json({
                success: false,
                error: "OneSignal request failed",
                details: result
            });
        }

        return res.status(200).json({
            success: true,
            message: "Push notification sent",
            onesignal: result
        });

    } catch (error) {
        console.error("send-alert error:", error);

        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}
