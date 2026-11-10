
const admin = require("firebase-admin");

const MINUTE = 60 * 1000;

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL:
            "https://smart-library-571ba-default-rtdb.europe-west1.firebasedatabase.app"
    });
}

module.exports = async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).send("Method not allowed");
    }

    if (
        req.headers["x-cron-secret"] !==
        process.env.CRON_SECRET
    ) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const db = admin.database();

        const snapshot = await db.ref("sensors").once("value");
        const sensors = snapshot.val();

        if (
            !sensors ||
            sensors.temperature == null ||
            sensors.humidity == null
        ) {
            return res.status(200).json({
                success: false,
                message: "No sensor data"
            });
        }

        const now = Date.now();
        const timestamp = Math.floor(now / MINUTE) * MINUTE;

        const historyRef = db.ref(`history/${timestamp}`);

        await historyRef.set({
            timestamp,
            temperature: Number(sensors.temperature),
            humidity: Number(sensors.humidity)
        });

        return res.status(200).json({
            success: true,
            timestamp,
            temperature: Number(sensors.temperature),
            humidity: Number(sensors.humidity)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "History archive failed"
        });
    }
};
