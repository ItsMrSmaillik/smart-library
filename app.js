
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto/+esm";

// FIREBASE CONFIGURATION

const firebaseConfig = {
    apiKey: "AIzaSyAEpLDi1MxEnK4OBdS41Z1SjFiLbx0_G9M", // Оставь здесь свой настоящий API key!
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

const temperatureRef = ref(database, "sensors/temperature");
const humidityRef = ref(database, "sensors/humidity");

// CURRENT VALUES

let temperature = null;
let humidity = null;

// HTML ELEMENTS

const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const connectionElement = document.getElementById("connectionText");
const climateStatusElement = document.getElementById("climateStatus");
const lastUpdateElement = document.getElementById("lastUpdate");

// CHART

const chart = new Chart(
    document.getElementById("climateChart"),
    {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: "Температура (°C)",
                    data: [],
                    borderColor: "#ff9c58",
                    backgroundColor: "rgba(255, 156, 88, 0.12)",
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2
                },
                {
                    label: "Влажность (%)",
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

// UPDATE CLIMATE STATUS

function updateClimateStatus() {
    if (temperature === null || humidity === null) {
        climateStatusElement.textContent = "Ожидание данных";
        return;
    }

    if (temperature < 15 || temperature > 20) {
        climateStatusElement.textContent = "Температура вне заданного диапазона";
    } else if (humidity < 40 || humidity > 60) {
        climateStatusElement.textContent = "Влажность вне заданного диапазона";
    } else {
        climateStatusElement.textContent = "Показатели в заданном диапазоне";
    }
}

// UPDATE CHART

function updateChart() {
    if (temperature === null || humidity === null) return;

    const now = new Date();

    const time = now.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    chart.data.labels.push(time);

    chart.data.datasets[0].data.push(temperature);
    chart.data.datasets[1].data.push(humidity);

    // Оставляем последние 30 измерений

    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    chart.update();

    lastUpdateElement.textContent =
        "Последнее обновление: " + time;
}

// TEMPERATURE

onValue(temperatureRef, (snapshot) => {
    const value = snapshot.val();

    temperature = value === null ? null : Number(value);

    temperatureElement.textContent =
        temperature === null ? "Нет данных" : temperature.toFixed(1);

    updateClimateStatus();
    updateChart();

    connectionElement.textContent = "Firebase connected";
}, (error) => {
    connectionElement.textContent = "Connection error";
    console.error("Temperature error:", error);
});

// HUMIDITY

onValue(humidityRef, (snapshot) => {
    const value = snapshot.val();

    humidity = value === null ? null : Number(value);

    humidityElement.textContent =
        humidity === null ? "Нет данных" : humidity.toFixed(1);

    updateClimateStatus();
    updateChart();

    connectionElement.textContent = "Firebase connected";
}, (error) => {
    connectionElement.textContent = "Connection error";
    console.error("Humidity error:", error);
});
