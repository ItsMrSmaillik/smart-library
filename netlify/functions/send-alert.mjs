// ============================================================
// SMART LIBRARY — NETLIFY PUSH FUNCTION
// ESP32 -> Netlify Function -> OneSignal
// Languages: RU / RO / EN
// ============================================================

const LANGUAGES = {
  ru: {
    alertTitle: "⚠️ Smart Library — предупреждение",
    recoveryTitle: "✅ Smart Library — показатели в норме",
    tempLow: "Температура ниже допустимого минимума",
    tempHigh: "Температура выше допустимого максимума",
    humidityLow: "Влажность ниже допустимого минимума",
    humidityHigh: "Влажность выше допустимого максимума",
    recovery: "Показатели вернулись в допустимые пределы",
    temperature: "Температура",
    humidity: "Влажность"
  },

  ro: {
    alertTitle: "⚠️ Smart Library — alertă",
    recoveryTitle: "✅ Smart Library — valori normale",
    tempLow: "Temperatura este sub limita minimă",
    tempHigh: "Temperatura este peste limita maximă",
    humidityLow: "Umiditatea este sub limita minimă",
    humidityHigh: "Umiditatea este peste limita maximă",
    recovery: "Valorile au revenit în limitele normale",
    temperature: "Temperatură",
    humidity: "Umiditate"
  },

  en: {
    alertTitle: "⚠️ Smart Library — warning",
    recoveryTitle: "✅ Smart Library — values normal",
    tempLow: "Temperature is below the minimum limit",
    tempHigh: "Temperature is above the maximum limit",
    humidityLow: "Humidity is below the minimum limit",
    humidityHigh: "Humidity is above the maximum limit",
    recovery: "Values have returned to the allowed range",
    temperature: "Temperature",
    humidity: "Humidity"
  }
};

function jsonResponse(statusCode, data) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function formatValue(value, suffix) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(1)} ${suffix}`;
}

export default async (request) => {
  // Only POST requests are accepted.
  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed"
    });
  }

  // Required environment variables.
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  const deviceToken = process.env.DEVICE_TOKEN;

  if (!appId || !restApiKey || !deviceToken) {
    console.error("Missing Netlify environment variables.");

    return jsonResponse(500, {
      success: false,
      error: "Server configuration is incomplete"
    });
  }

  // Authenticate the ESP32 request.
  const receivedToken = request.headers.get("x-device-token");

  if (receivedToken !== deviceToken) {
    return jsonResponse(401, {
      success: false,
      error: "Unauthorized"
    });
  }

  // Parse request body.
  let data;

  try {
    data = await request.json();
  } catch {
    return jsonResponse(400, {
      success: false,
      error: "Invalid JSON"
    });
  }

  const eventType = data.type;
  const language = LANGUAGES[data.language] ? data.language : "ru";

  const translations = LANGUAGES[language];

  if (!["alert", "recovery"].includes(eventType)) {
    return jsonResponse(400, {
      success: false,
      error: "Invalid event type"
    });
  }

  const alerts = Array.isArray(data.alerts)
    ? data.alerts
    : [];

  const allowedAlerts = [
    "tempLow",
    "tempHigh",
    "humidityLow",
    "humidityHigh"
  ];

  const validAlerts = alerts.filter((item) =>
    allowedAlerts.includes(item)
  );

  if (eventType === "alert" && validAlerts.length === 0) {
    return jsonResponse(400, {
      success: false,
      error: "No valid alerts provided"
    });
  }

  const temperature = Number(data.temperature);
  const humidity = Number(data.humidity);

  const temperatureText = formatValue(temperature, "°C");
  const humidityText = formatValue(humidity, "%");

  let title;
  let message;

  if (eventType === "alert") {
    title = translations.alertTitle;

    const descriptions = validAlerts.map(
      (alert) => translations[alert]
    );

    message = descriptions.join("\n");

  } else {
    title = translations.recoveryTitle;
    message = translations.recovery;
  }

  message +=
    `\n\n${translations.temperature}: ${temperatureText}` +
    `\n${translations.humidity}: ${humidityText}`;

  // Send push notification through OneSignal.
  try {
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
            en: title
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

      return jsonResponse(response.status, {
        success: false,
        error: "OneSignal request failed",
        details: result
      });
    }

    console.log("Push notification sent:", result.id);

    return jsonResponse(200, {
      success: true,
      notificationId: result.id
    });

  } catch (error) {
    console.error("Push sending error:", error);

    return jsonResponse(500, {
      success: false,
      error: "Could not send push notification"
    });
  }
};
