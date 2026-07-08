import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Function to read state from file
async function getState() {
  try {
    if (!fs.existsSync(dbPath)) {
      throw new Error("db.json not found");
    }
    const data = await fs.promises.readFile(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database", error);
    return null;
  }
}

// Function to write state to file
async function saveState(state: any) {
  try {
    await fs.promises.writeFile(dbPath, JSON.stringify(state, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving database", error);
    return false;
  }
}

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API: Get Current state
app.get("/api/state", async (req, res) => {
  const state = await getState();
  if (state) {
    res.json({ success: true, state });
  } else {
    res.status(500).json({ success: false, message: "State could not be read" });
  }
});

// API: Update full or partial state
app.post("/api/state/update", async (req, res) => {
  const currentState = await getState();
  if (!currentState) {
    return res.status(500).json({ success: false, message: "Database read error" });
  }

  const updatedState = { ...currentState, ...req.body };
  const success = await saveState(updatedState);

  if (success) {
    res.json({ success: true, state: updatedState });
  } else {
    res.status(500).json({ success: false, message: "Database write error" });
  }
});

// API: Log a visit (for charts & stats)
app.post("/api/visit", async (req, res) => {
  const state = await getState();
  if (!state) return res.status(500).json({ success: false });

  const { type, user } = req.body; // e.g. type="Kirish", user="Mehmon"
  const now = new Date();
  const timeStr = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  // Update visit list log
  if (!state.stats.visitsLog) {
    state.stats.visitsLog = [];
  }
  state.stats.visitsLog.unshift({ time: timeStr, type, user });
  if (state.stats.visitsLog.length > 50) state.stats.visitsLog.pop();

  // Increment metrics
  state.stats.totalVisits = (state.stats.totalVisits || 0) + 1;
  state.stats.activeUsers = Math.max(1, (state.stats.activeUsers || 0) + (type === "Kirish" ? 1 : -1));

  // Add random activity to visits hourly/daily/monthly charts to show dynamics
  const lastHourIdx = state.stats.hourlyVisits.length - 1;
  state.stats.hourlyVisits[lastHourIdx] = (state.stats.hourlyVisits[lastHourIdx] || 0) + 1;

  await saveState(state);
  res.json({ success: true, totalVisits: state.stats.totalVisits, activeUsers: state.stats.activeUsers });
});

// API: Server Side Text-to-Speech (using gemini-3.1-flash-tts-preview)
app.post("/api/tts", async (req, res) => {
  const { text, voice = "Kore" } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: "Matn taqdim etilmadi (Text required)" });
  }

  try {
    const ai = getAi();
    // Prebuilt voices supported by model: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const cleanVoice = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voice) ? voice : "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: cleanVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ success: true, audio: base64Audio });
    } else {
      res.status(500).json({ success: false, message: "Ovozli ma'lumot generatsiya qilinmadi (TTS generation empty)" });
    }
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    res.status(500).json({ success: false, message: error.message || "Gemini TTS error" });
  }
});

// Vite Setup / Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Oshxona CRM server listening on port ${PORT}`);
  });
}

startServer();
