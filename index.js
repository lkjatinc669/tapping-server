import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// Load Firebase service account from env
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// In-memory store (OK for personal project)
const pairs = {}; // { code: { a: tokenA, b: tokenB } }

app.get("/", (req, res) => {
  res.send("You can Tap to Ping")
})

// Register device token
app.post("/register", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send("Missing token");
  res.send("Registered");
});

// Create pairing code
app.post("/pair/create", (req, res) => {
  const { code, token } = req.body;
  pairs[code] = { a: token };
  res.send("Pair created");
});

// Join pairing
app.post("/pair/join", (req, res) => {
  const { code, token } = req.body;
  if (!pairs[code]) return res.status(404).send("Invalid code");
  pairs[code].b = token;
  res.send("Paired");
});

// Send ping
app.post("/ping", async (req, res) => {
  const { token } = req.body;

  for (const pair of Object.values(pairs)) {
    if (pair.a === token && pair.b) {
      await admin.messaging().send({
        token: pair.b,
        data: { ping: "1" },
        android: { priority: "high" }
      });
      return res.send("Ping sent");
    }
  }
  res.status(404).send("No paired device");
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Backend running")
);
