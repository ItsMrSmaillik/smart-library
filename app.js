
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEpLDi1MxEnK4OBdS41Z1SjFiLbx0_G9M",
  authDomain: "smart-library-571ba.firebaseapp.com",
  databaseURL: "https://smart-library-571ba-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smart-library-571ba",
  storageBucket: "smart-library-571ba.firebasestorage.app",
  messagingSenderId: "711061193508",
  appId: "1:711061193508:web:cd02f03b11124dca3869b1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const temperatureRef = ref(database, "sensors/temperature");
const humidityRef = ref(database, "sensors/humidity");

onValue(temperatureRef, (snapshot) => {
  const value = snapshot.val();
  document.getElementById("temperature").textContent =
    value === null ? "Нет данных" : value + " °C";
});

onValue(humidityRef, (snapshot) => {
  const value = snapshot.val();
  document.getElementById("humidity").textContent =
    value === null ? "Нет данных" : value + " %";
});
