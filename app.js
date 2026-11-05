
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";

// FIREBASE CONFIGURATION

const firebaseConfig = {
    apiKey: "AIzaSyAEpLDi1MxEnK4OBdS41Z1SjFiLbx0_G9M",
    authDomain: "smart-library-571ba.firebaseapp.com",
    databaseURL: "https://smart-library-571ba-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-library-571ba",
    storageBucket: "smart-library-571ba.firebasestorage.app",
    messagingSenderId: "711061193508",
    appId: "1:711061193508:web:cd02f03b11124dca3869b1"
};

// INITIALIZATION

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sensorsRef = ref(database, "sensors");

// HTML ELEMENTS

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const connectionElement = document.getElementById("connectionText");
const climateStatusElement = document.getElementById("climateStatus");
const lastUpdateElement = document.getElementById("lastUpdate");
const languageSelect = document.getElementById("languageSelect");

// CURRENT VALUES

let temperature = null;
let humidity = null;
let lastUpdateTime = null;
let chartSampleTimer = null;
let lastChartKey = null;

// LANGUAGES

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
        humidityDataset: "Umiditate (%)"
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
        humidityDataset: "Влажность (%)"
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
        humidityDataset: "Humidity (%)"
    }
};

// LANGUAGE SETTINGS

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

// TRANSLATION FUNCTION

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
}

// LANGUAGE SELECTOR

if (languageSelect) {
    languageSelect.addEventListener("change", event => {
        applyLanguage(event.target.value);
    });
}

// CHART

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

// CONNECTION STATUS

let connectionKey = "waitingData";

function updateConnectionText() {
    if (connectionElement) {
        connectionElement.textContent = translate(connectionKey);
    }
}

// CLIMATE STATUS

function updateClimateStatus() {
    if (!climateStatusElement) return;

    if (temperature === null || humidity === null) {
        climateStatusElement.textContent = translate("waitingData");
        return;
    }

    const temperatureWarning = temperature < 15 || temperature > 20;
    const humidityWarning = humidity < 40 || humidity > 60;

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

// LAST UPDATE

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

    lastUpdateElement.textContent = `${translate("lastUpdate")}: ${time}`;
}

// CHART UPDATE

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

// FIREBASE DATA

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

// INITIAL LANGUAGE

applyLanguage(currentLanguage);
