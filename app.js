
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";

// =====================================================
// MICROCLIMATE SETTINGS — CHANGE THESE VALUES
// =====================================================

const TEMP_MIN = 15;       // Minimum temperature (°C)
const TEMP_MAX = 30;       // Maximum temperature (°C)

const HUMIDITY_MIN = 40;   // Minimum humidity (%)
const HUMIDITY_MAX = 60;   // Maximum humidity (%)

// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyAEpLDi1MxEnK4OBdS41Z1SjFiLbx0_G9M",
    authDomain: "smart-library-571ba.firebaseapp.com",
    databaseURL: "https://smart-library-571ba-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-library-571ba",
    storageBucket: "smart-library-571ba.firebasestorage.app",
    messagingSenderId: "711061193508",
    appId: "1:711061193508:web:cd02f03b11124dca3869b1"
};

// =====================================================
// INITIALIZATION
// =====================================================

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sensorsRef = ref(database, "sensors");

// =====================================================
// HTML ELEMENTS
// =====================================================

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const connectionElement = document.getElementById("connectionText");
const climateStatusElement = document.getElementById("climateStatus");
const lastUpdateElement = document.getElementById("lastUpdate");
const languageSelect = document.getElementById("languageSelect");

// =====================================================
// CURRENT VALUES
// =====================================================

let temperature = null;
let humidity = null;
let lastUpdateTime = null;
let chartSampleTimer = null;
let lastChartKey = null;

// =====================================================
// LANGUAGES
// =====================================================

const translations = {
    ro: {
        workspace: "SPAȚIU DE LUCRU",
        dashboard: "Panou principal",
        analyticsMenu: "Analiză",
        settings: "Setări",

        eyebrow: "MONITORIZARE INTELIGENTĂ A MICROCLIMATULUI",
        subtitle: "Monitorizarea condițiilor de mediu din bibliotecă în timp real.",
        measurements: "Indicatori actuali",
        sensorSource: "Date transmise de senzorul BME280",

        temperature: "Temperatură",
        humidity: "Umiditate",
        temperatureDescription: "Temperatura actuală a încăperii",
        humidityDescription: "Umiditatea relativă a aerului",

        climateHeading: "Starea microclimatului",
        roomControl: "Monitorizarea încăperii",
        statusDescription: "Evaluarea valorilor măsurate",

        analytics: "Analiza datelor",
        chartDescription: "Evoluția temperaturii și umidității",
        chartTitle: "Istoricul măsurătorilor",

        footer: "Sistem de monitorizare a mediului",

        waitingData: "Se așteaptă datele",
        noData: "Lipsesc datele",
        connected: "Conectat la Firebase",
        connectionError: "Eroare de conexiune",

        normalStatus: "Indicatorii sunt în intervalul stabilit",
        temperatureWarning: "Temperatura este în afara intervalului stabilit",
        humidityWarning: "Umiditatea este în afara intervalului stabilit",
        bothWarning: "Temperatura și umiditatea sunt în afara intervalului stabilit",

        lastUpdate: "Ultima actualizare",

        temperatureDataset: "Temperatură (°C)",
        humidityDataset: "Umiditate (%)",

        notifications: "Notificări",
        noNotifications: "Nu există notificări.",
        markAllRead: "Marchează toate ca citite",
        clearNotifications: "Șterge toate",
        unread: "necitite",
        alertTitle: "Alertă microclimat",
        recoveryTitle: "Microclimat normal",
        recoveryMessage: "Temperatura și umiditatea au revenit în intervalul stabilit.",
        tempLow: "Temperatura este prea scăzută",
        tempHigh: "Temperatura este prea ridicată",
        humidityLow: "Umiditatea este prea scăzută",
        humidityHigh: "Umiditatea este prea ridicată",
        currentTemperature: "Temperatură",
        currentHumidity: "Umiditate"
    },

    ru: {
        workspace: "РАБОЧАЯ ОБЛАСТЬ",
        dashboard: "Главная панель",
        analyticsMenu: "Аналитика",
        settings: "Настройки",

        eyebrow: "УМНЫЙ МОНИТОРИНГ МИКРОКЛИМАТА",
        subtitle: "Мониторинг условий окружающей среды в библиотеке в реальном времени.",
        measurements: "Текущие показатели",
        sensorSource: "Данные, полученные от датчика BME280",

        temperature: "Температура",
        humidity: "Влажность",
        temperatureDescription: "Текущая температура помещения",
        humidityDescription: "Относительная влажность воздуха",

        climateHeading: "Состояние микроклимата",
        roomControl: "Мониторинг помещения",
        statusDescription: "Оценка измеренных показателей",

        analytics: "Аналитика данных",
        chartDescription: "Изменение температуры и влажности",
        chartTitle: "История измерений",

        footer: "Система мониторинга окружающей среды",

        waitingData: "Ожидание данных",
        noData: "Нет данных",
        connected: "Подключено к Firebase",
        connectionError: "Ошибка подключения",

        normalStatus: "Показатели находятся в заданном диапазоне",
        temperatureWarning: "Температура выходит за заданный диапазон",
        humidityWarning: "Влажность выходит за заданный диапазон",
        bothWarning: "Температура и влажность выходят за заданный диапазон",

        lastUpdate: "Последнее обновление",

        temperatureDataset: "Температура (°C)",
        humidityDataset: "Влажность (%)",

        notifications: "Уведомления",
        noNotifications: "Уведомлений пока нет.",
        markAllRead: "Отметить все прочитанными",
        clearNotifications: "Очистить все",
        unread: "непрочитанных",
        alertTitle: "Предупреждение о микроклимате",
        recoveryTitle: "Микроклимат в норме",
        recoveryMessage: "Температура и влажность вернулись в заданный диапазон.",
        tempLow: "Слишком низкая температура",
        tempHigh: "Слишком высокая температура",
        humidityLow: "Слишком низкая влажность",
        humidityHigh: "Слишком высокая влажность",
        currentTemperature: "Температура",
        currentHumidity: "Влажность"
    },

    en: {
        workspace: "WORKSPACE",
        dashboard: "Dashboard",
        analyticsMenu: "Analytics",
        settings: "Settings",

        eyebrow: "SMART MICROCLIMATE MONITORING",
        subtitle: "Real-time monitoring of environmental conditions in the library.",
        measurements: "Current measurements",
        sensorSource: "Data provided by the BME280 sensor",

        temperature: "Temperature",
        humidity: "Humidity",
        temperatureDescription: "Current room temperature",
        humidityDescription: "Relative air humidity",

        climateHeading: "Microclimate status",
        roomControl: "Room monitoring",
        statusDescription: "Evaluation of measured values",

        analytics: "Data analytics",
        chartDescription: "Temperature and humidity trends",
        chartTitle: "Measurement history",

        footer: "Environmental monitoring system",

        waitingData: "Waiting for data",
        noData: "No data",
        connected: "Connected to Firebase",
        connectionError: "Connection error",

        normalStatus: "Measurements are within the configured range",
        temperatureWarning: "Temperature is outside the configured range",
        humidityWarning: "Humidity is outside the configured range",
        bothWarning: "Temperature and humidity are outside the configured range",

        lastUpdate: "Last update",

        temperatureDataset: "Temperature (°C)",
        humidityDataset: "Humidity (%)",

        notifications: "Notifications",
        noNotifications: "No notifications yet.",
        markAllRead: "Mark all as read",
        clearNotifications: "Clear all",
        unread: "unread",
        alertTitle: "Microclimate alert",
        recoveryTitle: "Microclimate normal",
        recoveryMessage: "Temperature and humidity have returned to the configured range.",
        tempLow: "Temperature is too low",
        tempHigh: "Temperature is too high",
        humidityLow: "Humidity is too low",
        humidityHigh: "Humidity is too high",
        currentTemperature: "Temperature",
        currentHumidity: "Humidity"
    }
};

// =====================================================
// LANGUAGE SETTINGS
// =====================================================

const supportedLanguages = ["ro", "ru", "en"];

let currentLanguage = "ro";

try {
    const savedLanguage = localStorage.getItem("smartLibraryLanguage");

    if (supportedLanguages.includes(savedLanguage)) {
        currentLanguage = savedLanguage;
    }
} catch (error) {
    console.warn("Could not read saved language:", error);
}

// =====================================================
// TRANSLATION FUNCTION
// =====================================================

function translate(key) {
    return translations[currentLanguage][key] || key;
}

function applyLanguage(language) {
    if (!supportedLanguages.includes(language)) {
        language = "ro";
    }

    currentLanguage = language;

    try {
        localStorage.setItem("smartLibraryLanguage", language);
    } catch (error) {
        console.warn("Could not save language:", error);
    }

    document.documentElement.lang = language;

    if (languageSelect) {
        languageSelect.value = language;
    }

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;

        if (translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });

    if (chart) {
        chart.data.datasets[0].label = translate("temperatureDataset");
        chart.data.datasets[1].label = translate("humidityDataset");
        chart.update();
    }

    updateConnectionText();
    updateClimateStatus();
    updateLastUpdate();
    renderNotifications();
}

// =====================================================
// LANGUAGE SELECTOR
// =====================================================

if (languageSelect) {
    languageSelect.addEventListener("change", event => {
        applyLanguage(event.target.value);
    });
}

// =====================================================
// CHART
// =====================================================

const chart = new Chart(
    document.getElementById("climateChart"),
    {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: translations[currentLanguage].temperatureDataset,
                    data: [],
                    borderColor: "#ff9c58",
                    backgroundColor: "rgba(255, 156, 88, 0.12)",
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2
                },
                {
                    label: translations[currentLanguage].humidityDataset,
                    data: [],
                    borderColor: "#28c8ed",
                    backgroundColor: "rgba(40, 200, 237, 0.10)",
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#aab8cc",
                        usePointStyle: true
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#718198",
                        maxTicksLimit: 6
                    },
                    grid: {
                        color: "rgba(255,255,255,0.04)"
                    }
                },

                y: {
                    ticks: {
                        color: "#718198"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.06)"
                    }
                }
            }
        }
    }
);

// =====================================================
// CONNECTION STATUS
// =====================================================

let connectionKey = "waitingData";

function updateConnectionText() {
    if (connectionElement) {
        connectionElement.textContent = translate(connectionKey);
    }
}

// =====================================================
// CLIMATE STATUS
// =====================================================

function getActiveAlerts() {
    const alerts = [];

    if (temperature === null || humidity === null) {
        return alerts;
    }

    if (temperature < TEMP_MIN) {
        alerts.push("tempLow");
    } else if (temperature > TEMP_MAX) {
        alerts.push("tempHigh");
    }

    if (humidity < HUMIDITY_MIN) {
        alerts.push("humidityLow");
    } else if (humidity > HUMIDITY_MAX) {
        alerts.push("humidityHigh");
    }

    return alerts;
}

function updateClimateStatus() {
    if (!climateStatusElement) return;

    if (temperature === null || humidity === null) {
        climateStatusElement.textContent = translate("waitingData");
        return;
    }

    const temperatureWarning =
        temperature < TEMP_MIN || temperature > TEMP_MAX;

    const humidityWarning =
        humidity < HUMIDITY_MIN || humidity > HUMIDITY_MAX;

    if (temperatureWarning && humidityWarning) {
        climateStatusElement.textContent = translate("bothWarning");
    } else if (temperatureWarning) {
        climateStatusElement.textContent = translate("temperatureWarning");
    } else if (humidityWarning) {
        climateStatusElement.textContent = translate("humidityWarning");
    } else {
        climateStatusElement.textContent = translate("normalStatus");
    }
}

// =====================================================
// NOTIFICATION STORAGE
// =====================================================

const NOTIFICATIONS_STORAGE_KEY = "smartLibraryNotifications";

let notifications = [];

try {
    const savedNotifications = localStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY
    );

    if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);

        if (Array.isArray(parsed)) {
            notifications = parsed.slice(0, 50);
        }
    }
} catch (error) {
    console.warn("Could not load notifications:", error);
}

function saveNotifications() {
    try {
        localStorage.setItem(
            NOTIFICATIONS_STORAGE_KEY,
            JSON.stringify(notifications)
        );
    } catch (error) {
        console.warn("Could not save notifications:", error);
    }
}

// =====================================================
// NOTIFICATION INTERFACE
// =====================================================

const notificationStyles = document.createElement("style");

notificationStyles.textContent = `
    .sl-notification-widget {
        position: fixed;
        right: 25px;
        bottom: 25px;
        z-index: 9999;
        font-family: inherit;
    }

    .sl-notification-button {
        position: relative;
        width: 54px;
        height: 54px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 18px;
        background: #17263a;
        color: #ffffff;
        font-size: 22px;
        cursor: pointer;
        box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        transition: 0.2s ease;
    }

    .sl-notification-button:hover {
        background: #213650;
        transform: translateY(-2px);
    }

    .sl-notification-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 19px;
        height: 19px;
        padding: 0 5px;
        border-radius: 20px;
        background: #ef5350;
        color: white;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #101d30;
    }

    .sl-notification-panel {
        display: none;
        position: absolute;
        right: 0;
        bottom: 68px;
        width: min(360px, calc(100vw - 35px));
        max-height: 460px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 16px;
        background: #142238;
        color: #eaf1fa;
        box-shadow: 0 15px 45px rgba(0,0,0,0.4);
    }

    .sl-notification-panel.open {
        display: flex;
        flex-direction: column;
    }

    .sl-notification-header {
        padding: 17px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    .sl-notification-header strong {
        font-size: 15px;
    }

    .sl-notification-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .sl-notification-actions button {
        border: none;
        background: rgba(255,255,255,0.07);
        color: #aebed1;
        border-radius: 7px;
        padding: 6px 9px;
        font-size: 11px;
        cursor: pointer;
    }

    .sl-notification-actions button:hover {
        background: rgba(255,255,255,0.13);
        color: white;
    }

    .sl-notification-list {
        overflow-y: auto;
        max-height: 320px;
        padding: 8px;
    }

    .sl-notification-item {
        padding: 12px;
        margin-bottom: 7px;
        border-radius: 10px;
        background: rgba(255,255,255,0.045);
        border-left: 3px solid #ef5350;
        cursor: pointer;
    }

    .sl-notification-item.read {
        opacity: 0.58;
        border-left-color: #718198;
    }

    .sl-notification-item.recovery {
        border-left-color: #35c995;
    }

    .sl-notification-item strong {
        display: block;
        font-size: 13px;
        margin-bottom: 5px;
    }

    .sl-notification-item p {
        margin: 0;
        color: #b9c7d9;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-line;
    }

    .sl-notification-item time {
        display: block;
        margin-top: 8px;
        color: #718198;
        font-size: 10px;
    }

    .sl-notification-empty {
        padding: 28px 15px;
        text-align: center;
        color: #8fa1b8;
        font-size: 13px;
    }

    @media (max-width: 500px) {
        .sl-notification-widget {
            right: 15px;
            bottom: 15px;
        }
    }
`;

document.head.appendChild(notificationStyles);

const notificationWidget = document.createElement("div");
notificationWidget.className = "sl-notification-widget";

const notificationButton = document.createElement("button");
notificationButton.className = "sl-notification-button";
notificationButton.type = "button";
notificationButton.textContent = "♧";
notificationButton.setAttribute("aria-label", "Notifications");

const notificationBadge = document.createElement("span");
notificationBadge.className = "sl-notification-badge";
notificationBadge.style.display = "none";

notificationButton.appendChild(notificationBadge);

const notificationPanel = document.createElement("div");
notificationPanel.className = "sl-notification-panel";

const notificationHeader = document.createElement("div");
notificationHeader.className = "sl-notification-header";

const notificationTitle = document.createElement("strong");

const notificationActions = document.createElement("div");
notificationActions.className = "sl-notification-actions";

const markReadButton = document.createElement("button");
markReadButton.type = "button";

const clearNotificationsButton = document.createElement("button");
clearNotificationsButton.type = "button";

notificationActions.appendChild(markReadButton);
notificationActions.appendChild(clearNotificationsButton);

const notificationList = document.createElement("div");
notificationList.className = "sl-notification-list";

notificationHeader.appendChild(notificationTitle);

notificationPanel.appendChild(notificationHeader);
notificationPanel.appendChild(notificationActions);
notificationPanel.appendChild(notificationList);

notificationWidget.appendChild(notificationButton);
notificationWidget.appendChild(notificationPanel);

document.body.appendChild(notificationWidget);

// =====================================================
// NOTIFICATION TEXT
// =====================================================

function getNotificationText(notification) {
    if (notification.type === "recovery") {
        return {
            title: translate("recoveryTitle"),
            body: translate("recoveryMessage")
        };
    }

    const messages = (notification.alerts || []).map(key => {
        return translate(key);
    });

    const details = [];

    if (notification.temperature !== null &&
        notification.temperature !== undefined) {
        details.push(
            `${translate("currentTemperature")}: ${notification.temperature.toFixed(1)} °C`
        );
    }

    if (notification.humidity !== null &&
        notification.humidity !== undefined) {
        details.push(
            `${translate("currentHumidity")}: ${notification.humidity.toFixed(1)} %`
        );
    }

    return {
        title: translate("alertTitle"),
        body: [...messages, ...details].join("\n")
    };
}

// =====================================================
// RENDER NOTIFICATIONS
// =====================================================

function renderNotifications() {
    const unreadCount = notifications.filter(item => !item.read).length;

    notificationBadge.textContent =
        unreadCount > 99 ? "99+" : String(unreadCount);

    notificationBadge.style.display =
        unreadCount > 0 ? "flex" : "none";

    notificationTitle.textContent = translate("notifications");
    markReadButton.textContent = translate("markAllRead");
    clearNotificationsButton.textContent = translate("clearNotifications");

    notificationList.replaceChildren();

    if (notifications.length === 0) {
        const empty = document.createElement("div");
        empty.className = "sl-notification-empty";
        empty.textContent = translate("noNotifications");
        notificationList.appendChild(empty);
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("div");

        item.className = "sl-notification-item";

        if (notification.read) {
            item.classList.add("read");
        }

        if (notification.type === "recovery") {
            item.classList.add("recovery");
        }

        const text = getNotificationText(notification);

        const title = document.createElement("strong");
        title.textContent = text.title;

        const body = document.createElement("p");
        body.textContent = text.body;

        const time = document.createElement("time");

        const date = new Date(notification.timestamp);

        time.textContent = date.toLocaleString(
            currentLanguage === "ru"
                ? "ru-RU"
                : currentLanguage === "ro"
                    ? "ro-RO"
                    : "en-GB",
            {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

        item.appendChild(title);
        item.appendChild(body);
        item.appendChild(time);

        item.addEventListener("click", () => {
            notification.read = true;
            saveNotifications();
            renderNotifications();
        });

        notificationList.appendChild(item);
    });
}

// =====================================================
// ADD NOTIFICATION
// =====================================================

function addNotification(type, alerts = []) {
    const notification = {
        type,
        alerts,
        temperature,
        humidity,
        timestamp: Date.now(),
        read: false
    };

    notifications.unshift(notification);

    // Keep the last 50 notifications

    notifications = notifications.slice(0, 50);

    saveNotifications();
    renderNotifications();
}

// =====================================================
// NOTIFICATION BUTTONS
// =====================================================

notificationButton.addEventListener("click", () => {
    notificationPanel.classList.toggle("open");
});

document.addEventListener("click", event => {
    if (!notificationWidget.contains(event.target)) {
        notificationPanel.classList.remove("open");
    }
});

markReadButton.addEventListener("click", () => {
    notifications.forEach(item => {
        item.read = true;
    });

    saveNotifications();
    renderNotifications();
});

clearNotificationsButton.addEventListener("click", () => {
    notifications = [];

    saveNotifications();
    renderNotifications();
});

// =====================================================
// AUTOMATIC ALERT DETECTION
// =====================================================

let previousAlertState = null;

function checkClimateAlerts() {
    if (temperature === null || humidity === null) {
        return;
    }

    const activeAlerts = getActiveAlerts();
    const currentState = activeAlerts.join("|");

    // First valid sensor reading

    if (previousAlertState === null) {
        previousAlertState = currentState;

        if (activeAlerts.length > 0) {
            addNotification("alert", activeAlerts);
        }

        return;
    }

    // Nothing changed — do not create duplicate notifications

    if (currentState === previousAlertState) {
        return;
    }

    // Values have returned to normal

    if (currentState === "" && previousAlertState !== "") {
        addNotification("recovery");
    }

    // New warning or a changed warning

    else if (currentState !== "") {
        addNotification("alert", activeAlerts);
    }

    previousAlertState = currentState;
}

// =====================================================
// LAST UPDATE
// =====================================================

function updateLastUpdate() {
    if (!lastUpdateElement) return;

    if (!lastUpdateTime) {
        lastUpdateElement.textContent = translate("waitingData");
        return;
    }

    const locale = {
        ro: "ro-RO",
        ru: "ru-RU",
        en: "en-GB"
    }[currentLanguage];

    const time = lastUpdateTime.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    lastUpdateElement.textContent =
        `${translate("lastUpdate")}: ${time}`;
}

// =====================================================
// CHART UPDATE
// =====================================================

function addChartPoint() {
    if (temperature === null || humidity === null) return;

    const key = `${temperature}|${humidity}`;

    if (key === lastChartKey) return;

    lastChartKey = key;

    const locale = {
        ro: "ro-RO",
        ru: "ru-RU",
        en: "en-GB"
    }[currentLanguage];

    const time = new Date().toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(temperature);
    chart.data.datasets[1].data.push(humidity);

    // Keep the last 30 measurements

    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();

        chart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    chart.update();
}

// =====================================================
// FIREBASE DATA
// =====================================================

onValue(
    sensorsRef,

    snapshot => {
        const data = snapshot.val();

        if (!data) {
            temperature = null;
            humidity = null;
        } else {
            const newTemperature = Number(data.temperature);
            const newHumidity = Number(data.humidity);

            temperature = Number.isFinite(newTemperature)
                ? newTemperature
                : null;

            humidity = Number.isFinite(newHumidity)
                ? newHumidity
                : null;
        }

        temperatureElement.textContent =
            temperature === null
                ? translate("noData")
                : temperature.toFixed(1);

        humidityElement.textContent =
            humidity === null
                ? translate("noData")
                : humidity.toFixed(1);

        connectionKey = "connected";

        updateConnectionText();
        updateClimateStatus();

        // Check whether a notification is needed

        checkClimateAlerts();

        lastUpdateTime = new Date();
        updateLastUpdate();

        // Combine closely spaced Firebase updates into one chart point

        clearTimeout(chartSampleTimer);

        chartSampleTimer = setTimeout(() => {
            addChartPoint();
        }, 300);
    },

    error => {
        console.error("Firebase error:", error);

        connectionKey = "connectionError";
        updateConnectionText();
    }
);

// =====================================================
// INITIAL LANGUAGE AND NOTIFICATIONS
// =====================================================

applyLanguage(currentLanguage);
renderNotifications();
