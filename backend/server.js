import express from "express";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   CORS (SAFE)
================================ */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ===============================
   HEALTH
================================ */
app.get("/", (req, res) => {
  res.send("Alt Text Generator backend running");
});

/* ===============================
   HELPERS
================================ */
function detectLanguage(text) {
  return /^[a-zA-Z0-9\s.,-]+$/.test(text)
    ? "English"
    : "Text in foreign Language";
}

function detectImageType(text) {
  if (/signature|handwritten|text/i.test(text)) return "Text-based image";
  if (/graph|chart|axis|bar|line/i.test(text)) return "Graph";
  if (/diagram|flow/i.test(text)) return "Diagram";
  if (/screen|interface|menu/i.test(text)) return "Screenshot";
  return "Photograph";
}

function wcagScore(text) {
  let score = 100;
  if (text.length > 600) score -= 30;
  if (!/^(a |an |the )/i.test(text)) score -= 20;
  if (/visual|image|likely|suggests|appears|atmosphere/i.test(text)) score -= 30;
  return Math.max(score, 0);
}

/* ===============================
   MAIN ROUTE
================================ */
app.post("/generate-alt-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image missing" });
    }

    const { contextText = "", rules = "" } = req.body;
    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype;

    const systemPrompt = `
You are an accessibility expert.

STRICT RULES
Never start with the visual, the image, or this image
Always start with an article a an or the
Describe only what is visible
Do not interpret emotion mood or intent
Do not guess
Use American English
Keep under six hundred characters
Avoid words image visual likely suggests appears atmosphere
If the content is text or handwriting describe the text directly
Be concise and factual

USER RULES
${rules}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: contextText || "Describe the content." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mime};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 220
        })
      }
    );

    const data = await response.json();
    let altText = data.choices[0].message.content.trim();

    if (altText.length > 600) {
      altText = altText.slice(0, 597) + "...";
    }

    res.json({
      altText,
      length: altText.length,
      imageType: detectImageType(altText),
      language: detectLanguage(altText),
      score: wcagScore(altText)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
