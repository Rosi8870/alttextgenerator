import express from "express";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   HARD CORS (NO FAIL POSSIBLE)
================================ */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Alt Text Generator backend running");
});

/* ===============================
   MAIN ROUTE
================================ */
app.post("/generate-alt-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image missing" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an accessibility expert. Describe only what is visible. Start with an article. Avoid guessing."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Describe the visual." },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!data.choices) {
      return res.status(500).json({ error: "OpenAI error" });
    }

    const altText = data.choices[0].message.content.trim();

    res.json({
      altText,
      length: altText.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
