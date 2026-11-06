import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    set
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";


// =====================================================
// MICROCLIMATE SETTINGS — CHANGE THESE VALUES
// =====================================================

const TEMP_MIN = 15;
const TEMP_MAX = 30;

const HUMIDITY_MIN = 40;
const HUMIDITY_MAX = 60;


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
const notificationSettingsRef = ref(database, "settings/notifications");


// =====================================================
// ONESIGNAL INITIALIZATION
// =====================================================

let oneSignalInstance = null;
let pushInitialized = false;

window.OneSignalDeferred = window.OneSignalDeferred || [];

const oneSignalReady = new Promise((resolve, reject) => {
    window.OneSignalDeferred.push(async function (OneSignal) {
        try {
            oneSignalInstance = OneSignal;
            resolve(OneSignal);
        } catch (error) {
            reject(error);
        }
    });
});


// =====================================================
// PUSH NOTIFICATIONS — ONESIGNAL
// =====================================================

async function enablePushNotifications() {
    try {
        if (!("Notification" in window)) {
            throw new Error("Ваш браузер не поддерживает уведомления.");
        }

        if (!("serviceWorker" in navigator)) {
            throw new Error("Service Worker не поддерживается браузером.");
        }

        const OneSignal = await oneSignalReady;

        await OneSignal.Notifications.requestPermission();

        if (Notification.permission !== "granted") {
            throw new Error("Разрешение на уведомления не предоставлено.");
        }

        await OneSignal.User.PushSubscription.optIn();

        pushInitialized = true;

        console.log(
            "OneSignal Push subscription enabled.",
            OneSignal.User.PushSubscription.id || "(subscription ID pending)"
        );

        return true;

    } catch (error) {
        console.error("OneSignal Push error:", error);
        throw error;
    }
}


// =====================================================
// HTML ELEMENTS
// =====================================================

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const connectionElement = document.getElementById("connectionText");
const climateStatusElement = document.getElementById("climateStatus");
const lastUpdateElement = document.getElementById("lastUpdate");
const languageSelect = document.getElementById("languageSelect");

const mainElement = document.querySelector(".main");
const footerElement = document.querySelector(".footer");
const sidebarMenuItems = document.querySelectorAll(".sidebar .menu-item");


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
        currentHumidity: "Umiditate",
        websiteNotifications: "Notificări pe site",
        websiteNotificationsDescription: "Salvează alertele în istoricul notificărilor",
        telegramNotifications: "Notificări Telegram",
        telegramNotificationsDescription: "Trimite alerte prin Telegram",
        soundNotifications: "Notificări sonore",
        soundNotificationsDescription: "Redă un sunet la apariția alertelor",
        pushNotifications: "Notificări Push",
        pushNotificationsDescription: "Primește notificări în browser și Windows",
        pushEnable: "Activează",
        pushConnecting: "Se conectează...",
        pushConnected: "Conectat",
        pushPermissionDenied: "Permisiunea pentru notificări nu a fost acordată.",
        pushSuccess: "Notificările Push au fost activate.",
        pushError: "Nu s-a putut activa Push.",
        settingsSaved: "Setările au fost sincronizate cu Firebase.",
        settingsSaving: "Se salvează setările...",
        settingsError: "Nu s-au putut salva setările.",
        settingsLoading: "Se încarcă setările...",
        settingsUnavailable: "Setările nu sunt disponibile."
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
        currentHumidity: "Влажность",
        websiteNotifications: "Уведомления на сайте",
        websiteNotificationsDescription: "Сохранять предупреждения в истории уведомлений",
        telegramNotifications: "Уведомления Telegram",
        telegramNotificationsDescription: "Отправлять предупреждения через Telegram",
        soundNotifications: "Звуковые уведомления",
        soundNotificationsDescription: "Воспроизводить звук при появлении предупреждений",
        pushNotifications: "Push-уведомления",
        pushNotificationsDescription: "Получать уведомления в браузере и Windows",
        pushEnable: "Включить",
        pushConnecting: "Подключение...",
        pushConnected: "Подключено",
        pushPermissionDenied: "Разрешение на уведомления не предоставлено.",
        pushSuccess: "Push-уведомления активированы.",
        pushError: "Не удалось активировать Push.",
        settingsSaved: "Настройки синхронизированы с Firebase.",
        settingsSaving: "Сохранение настроек...",
        settingsError: "Не удалось сохранить настройки.",
        settingsLoading: "Загрузка настроек...",
        settingsUnavailable: "Настройки недоступны."
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
        currentHumidity: "Humidity",
        websiteNotifications: "Website notifications",
        websiteNotificationsDescription: "Save alerts in the notification history",
        telegramNotifications: "Telegram notifications",
        telegramNotificationsDescription: "Send alerts through Telegram",
        soundNotifications: "Sound notifications",
        soundNotificationsDescription: "Play a sound when alerts appear",
        pushNotifications: "Push notifications",
        pushNotificationsDescription: "Receive notifications in your browser and Windows",
        pushEnable: "Enable",
        pushConnecting: "Connecting...",
        pushConnected: "Connected",
        pushPermissionDenied: "Notification permission was not granted.",
        pushSuccess: "Push notifications have been enabled.",
        pushError: "Could not enable Push.",
        settingsSaved: "Settings synchronized with Firebase.",
        settingsSaving: "Saving settings...",
        settingsError: "Could not save settings.",
        settingsLoading: "Loading settings...",
        settingsUnavailable: "Settings are unavailable."
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

function translate(key) {
    return translations[currentLanguage]?.[key] || key;
}


// =====================================================
// CHART
// =====================================================

const chartCanvas = document.getElementById("climateChart");

const chart = chartCanvas ? new Chart(chartCanvas, {
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
}) : null;


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
// NOTIFICATION SETTINGS
// =====================================================

const DEFAULT_NOTIFICATION_SETTINGS = {
    website: true,
    telegram: true,
    sound: false
};

let notificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
let settingsLoaded = false;
let settingsWriteInProgress = false;

function setSettingsStatus(message) {
    const element = document.getElementById("settingsSaveStatus");
    if (element) element.textContent = message;
}

function updateSettingsControls() {
    const website = document.getElementById("websiteNotificationsToggle");
    const telegram = document.getElementById("telegramNotificationsToggle");
    const sound = document.getElementById("soundNotificationsToggle");

    if (website) website.checked = notificationSettings.website;
    if (telegram) telegram.checked = notificationSettings.telegram;
    if (sound) sound.checked = notificationSettings.sound;
}

onValue(
    notificationSettingsRef,
    async snapshot => {
        const data = snapshot.val() || {};

        notificationSettings = {
            website: typeof data.website === "boolean"
                ? data.website
                : DEFAULT_NOTIFICATION_SETTINGS.website,
            telegram: typeof data.telegram === "boolean"
                ? data.telegram
                : DEFAULT_NOTIFICATION_SETTINGS.telegram,
            sound: typeof data.sound === "boolean"
                ? data.sound
                : DEFAULT_NOTIFICATION_SETTINGS.sound
        };

        settingsLoaded = true;
        updateSettingsControls();
        setSettingsStatus(translate("settingsSaved"));

        if (!snapshot.exists() && !settingsWriteInProgress) {
            settingsWriteInProgress = true;

            try {
                await set(notificationSettingsRef, DEFAULT_NOTIFICATION_SETTINGS);
            } catch (error) {
                console.error("Could not create default notification settings:", error);
                setSettingsStatus(translate("settingsError"));
            } finally {
                settingsWriteInProgress = false;
            }
        } else if (snapshot.exists()) {
            const missing = {};

            for (const key of Object.keys(DEFAULT_NOTIFICATION_SETTINGS)) {
                if (typeof data[key] !== "boolean") {
                    missing[key] = DEFAULT_NOTIFICATION_SETTINGS[key];
                }
            }

            if (Object.keys(missing).length > 0 && !settingsWriteInProgress) {
                settingsWriteInProgress = true;

                try {
                    for (const [key, value] of Object.entries(missing)) {
                        await set(ref(database, `settings/notifications/${key}`), value);
                    }
                } catch (error) {
                    console.error("Could not fill missing settings:", error);
                    setSettingsStatus(translate("settingsError"));
                } finally {
                    settingsWriteInProgress = false;
                }
            }
        }
    },
    error => {
        console.error("Notification settings Firebase error:", error);
        setSettingsStatus(translate("settingsUnavailable"));
    }
);

async function saveNotificationSetting(key, value) {
    if (!settingsLoaded) {
        updateSettingsControls();
        return;
    }

    const previousValue = notificationSettings[key];
    notificationSettings[key] = value;
    updateSettingsControls();
    setSettingsStatus(translate("settingsSaving"));

    try {
        await set(ref(database, `settings/notifications/${key}`), value);
        setSettingsStatus(translate("settingsSaved"));
    } catch (error) {
        console.error("Could not save notification setting:", error);
        notificationSettings[key] = previousValue;
        updateSettingsControls();
        setSettingsStatus(translate("settingsError"));
    }
}


// =====================================================
// SETTINGS PAGE
// =====================================================

function connectSettingsControls() {
    const website = document.getElementById("websiteNotificationsToggle");
    const telegram = document.getElementById("telegramNotificationsToggle");
    const sound = document.getElementById("soundNotificationsToggle");

    website?.addEventListener("change", event => {
        saveNotificationSetting("website", event.target.checked);
    });

    telegram?.addEventListener("change", event => {
        saveNotificationSetting("telegram", event.target.checked);
    });

    sound?.addEventListener("change", event => {
        saveNotificationSetting("sound", event.target.checked);
    });

    const pushButton = document.getElementById("enablePushButton");
    const pushStatus = document.getElementById("pushStatus");

    pushButton?.addEventListener("click", async () => {
        pushButton.disabled = true;
        pushButton.textContent = translate("pushConnecting");

        if (pushStatus) {
            pushStatus.textContent = translate("pushConnecting");
        }

        try {
            await enablePushNotifications();

            pushButton.textContent = translate("pushConnected");

            if (pushStatus) {
                pushStatus.textContent = translate("pushSuccess");
            }
        } catch (error) {
            pushButton.textContent = translate("pushEnable");

            if (pushStatus) {
                pushStatus.textContent =
                    `${translate("pushError")} ${error.message}`;
            }
        } finally {
            pushButton.disabled = false;
        }
    });

    updateSettingsControls();

    oneSignalReady.then(OneSignal => {
        pushInitialized = Boolean(OneSignal.User.PushSubscription.optedIn);

        const button = document.getElementById("enablePushButton");
        if (button && !button.disabled) {
            button.textContent = pushInitialized
                ? translate("pushConnected")
                : translate("pushEnable");
        }
    }).catch(error => {
        console.error("OneSignal SDK initialization error:", error);
    });
}

function ensureSettingsPage() {
    if (!mainElement || document.getElementById("settingsPage")) return;

    const page = document.createElement("section");
    page.id = "settingsPage";
    page.style.display = "none";

    page.innerHTML = `
        <div class="section-heading">
            <h2 data-i18n="settings">Настройки</h2>
            <span>SMART LIBRARY CONFIGURATION</span>
        </div>

        <div class="sl-settings-card">

            <div class="sl-settings-row">
                <div>
                    <h3 data-i18n="websiteNotifications"></h3>
                    <p data-i18n="websiteNotificationsDescription"></p>
                </div>

                <label class="sl-switch">
                    <input type="checkbox" id="websiteNotificationsToggle" checked>
                    <span class="sl-switch-slider"></span>
                </label>
            </div>

            <div class="sl-settings-divider"></div>

            <div class="sl-settings-row">
                <div>
                    <h3 data-i18n="telegramNotifications"></h3>
                    <p data-i18n="telegramNotificationsDescription"></p>
                </div>

                <label class="sl-switch">
                    <input type="checkbox" id="telegramNotificationsToggle" checked>
                    <span class="sl-switch-slider"></span>
                </label>
            </div>

            <div class="sl-settings-divider"></div>

            <div class="sl-settings-row">
                <div>
                    <h3 data-i18n="soundNotifications"></h3>
                    <p data-i18n="soundNotificationsDescription"></p>
                </div>

                <label class="sl-switch">
                    <input type="checkbox" id="soundNotificationsToggle">
                    <span class="sl-switch-slider"></span>
                </label>
            </div>

            <div class="sl-settings-divider"></div>

            <div class="sl-settings-row">
                <div>
                    <h3 data-i18n="pushNotifications"></h3>
                    <p data-i18n="pushNotificationsDescription"></p>
                </div>

                <button
                    type="button"
                    id="enablePushButton"
                    class="sl-push-button"
                    data-i18n="pushEnable"
                >
                    Включить
                </button>
            </div>

            <div id="pushStatus" class="sl-settings-save-status"></div>

            <div id="settingsSaveStatus" class="sl-settings-save-status"></div>

        </div>
    `;

    const style = document.createElement("style");

    style.textContent = `
        .sl-settings-card {
            background: linear-gradient(145deg, #141f30, #101927);
            border: 1px solid #233147;
            border-radius: 19px;
            padding: 10px 25px;
            margin-bottom: 30px;
        }

        .sl-settings-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 23px 0;
        }

        .sl-settings-row h3 {
            font-size: 14px;
            font-weight: 600;
        }

        .sl-settings-row p {
            color: #78879d;
            font-size: 12px;
            margin-top: 7px;
            line-height: 1.5;
        }

        .sl-settings-divider {
            height: 1px;
            background: #233147;
        }

        .sl-settings-save-status {
            padding: 12px 0;
            color: #78879d;
            font-size: 11px;
        }

        .sl-switch {
            position: relative;
            width: 48px;
            height: 27px;
            flex-shrink: 0;
        }

        .sl-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .sl-switch-slider {
            position: absolute;
            inset: 0;
            cursor: pointer;
            background: #344256;
            border-radius: 30px;
            transition: .25s;
        }

        .sl-switch-slider::before {
            content: "";
            position: absolute;
            width: 19px;
            height: 19px;
            left: 4px;
            top: 4px;
            background: white;
            border-radius: 50%;
            transition: .25s;
        }

        .sl-switch input:checked + .sl-switch-slider {
            background: #20bfae;
        }

        .sl-switch input:checked + .sl-switch-slider::before {
            transform: translateX(21px);
        }

        .sl-push-button {
            background: #20bfae;
            color: #071b24;
            border: none;
            border-radius: 9px;
            padding: 11px 17px;
            font-weight: 600;
            cursor: pointer;
            flex-shrink: 0;
            transition: .2s;
        }

        .sl-push-button:hover {
            background: #35d4c2;
        }

        .sl-push-button:disabled {
            opacity: .6;
            cursor: wait;
        }

        @media (max-width: 500px) {
            .sl-settings-card {
                padding: 8px 16px;
            }

            .sl-settings-row {
                gap: 12px;
            }
        }
    `;

    document.head.appendChild(style);

    if (footerElement) {
        mainElement.insertBefore(page, footerElement);
    } else {
        mainElement.appendChild(page);
    }

    connectSettingsControls();
}


// =====================================================
// NAVIGATION
// =====================================================

let currentPage = "dashboard";

function setActiveMenu(index) {
    sidebarMenuItems.forEach((item, itemIndex) => {
        item.classList.toggle("active", itemIndex === index);
    });
}

function getDashboardElements() {
    if (!mainElement) return [];

    return Array.from(mainElement.children).filter(element => {
        return element.tagName !== "HEADER" &&
            element !== footerElement &&
            element.id !== "settingsPage";
    });
}

function showPage(page) {
    currentPage = page;

    const settingsPage = document.getElementById("settingsPage");
    const dashboardElements = getDashboardElements();

    if (page === "settings") {
        dashboardElements.forEach(element => {
            element.style.display = "none";
        });

        if (settingsPage) settingsPage.style.display = "block";
        setActiveMenu(2);
        return;
    }

    if (settingsPage) settingsPage.style.display = "none";

    dashboardElements.forEach(element => {
        element.style.display = "";
    });

    if (page === "analytics") {
        setActiveMenu(1);

        const chartSection = document.getElementById("climateChart")?.closest("section");
        chartSection?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        setActiveMenu(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

if (sidebarMenuItems.length >= 3) {
    sidebarMenuItems[0].style.cursor = "pointer";
    sidebarMenuItems[1].style.cursor = "pointer";
    sidebarMenuItems[2].style.cursor = "pointer";

    sidebarMenuItems[0].addEventListener("click", () => showPage("dashboard"));
    sidebarMenuItems[1].addEventListener("click", () => showPage("analytics"));
    sidebarMenuItems[2].addEventListener("click", () => showPage("settings"));
}

ensureSettingsPage();


// =====================================================
// LANGUAGE APPLICATION
// =====================================================

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

    const pushButton = document.getElementById("enablePushButton");

    if (pushButton && !pushButton.disabled) {
        pushButton.textContent = pushInitialized
            ? translate("pushConnected")
            : translate("pushEnable");
    }

    updateConnectionText();
    updateClimateStatus();
    updateLastUpdate();
    renderNotifications();

    setSettingsStatus(settingsLoaded
        ? translate("settingsSaved")
        : translate("settingsLoading"));
}

if (languageSelect) {
    languageSelect.addEventListener("change", event => {
        applyLanguage(event.target.value);
    });
}


// =====================================================
// NOTIFICATION STORAGE
// =====================================================

const NOTIFICATIONS_STORAGE_KEY = "smartLibraryNotifications";
let notifications = [];

try {
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

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
// NOTIFICATION SOUND
// =====================================================

let notificationAudioContext = null;

function playNotificationSound() {
    if (!notificationSettings.sound) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!notificationAudioContext) {
            notificationAudioContext = new AudioContextClass();
        }

        if (notificationAudioContext.state === "suspended") {
            notificationAudioContext.resume().catch(() => {});
        }

        const context = notificationAudioContext;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, context.currentTime);

        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.10, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.26);
    } catch (error) {
        console.warn("Notification sound unavailable:", error);
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
notificationButton.textContent = "🔔";
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

    const messages = (notification.alerts || []).map(key => translate(key));
    const details = [];

    if (notification.temperature !== null &&
        notification.temperature !== undefined) {
        details.push(
            `${translate("currentTemperature")}: ${Number(notification.temperature).toFixed(1)} °C`
        );
    }

    if (notification.humidity !== null &&
        notification.humidity !== undefined) {
        details.push(
            `${translate("currentHumidity")}: ${Number(notification.humidity).toFixed(1)} %`
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

        if (notification.read) item.classList.add("read");
        if (notification.type === "recovery") item.classList.add("recovery");

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
    playNotificationSound();

    if (!notificationSettings.website) return;

    const notification = {
        type,
        alerts,
        temperature,
        humidity,
        timestamp: Date.now(),
        read: false
    };

    notifications.unshift(notification);
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
    if (temperature === null || humidity === null) return;

    const activeAlerts = getActiveAlerts();
    const currentState = activeAlerts.join("|");

    if (previousAlertState === null) {
        previousAlertState = currentState;

        if (activeAlerts.length > 0) {
            addNotification("alert", activeAlerts);
        }

        return;
    }

    if (currentState === previousAlertState) return;

    if (currentState === "" && previousAlertState !== "") {
        addNotification("recovery");
    } else if (currentState !== "") {
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
    if (!chart || temperature === null || humidity === null) return;

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

    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    chart.update();
}


// =====================================================
// FIREBASE SENSOR DATA
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

        if (temperatureElement) {
            temperatureElement.textContent =
                temperature === null
                    ? translate("noData")
                    : temperature.toFixed(1);
        }

        if (humidityElement) {
            humidityElement.textContent =
                humidity === null
                    ? translate("noData")
                    : humidity.toFixed(1);
        }

        connectionKey = "connected";
        updateConnectionText();
        updateClimateStatus();
        checkClimateAlerts();

        lastUpdateTime = new Date();
        updateLastUpdate();

        clearTimeout(chartSampleTimer);
        chartSampleTimer = setTimeout(addChartPoint, 300);
    },
    error => {
        console.error("Firebase sensor error:", error);
        connectionKey = "connectionError";
        updateConnectionText();
    }
);


// =====================================================
// INITIALIZATION
// =====================================================

applyLanguage(currentLanguage);
renderNotifications();
setSettingsStatus(translate("settingsLoading"));
