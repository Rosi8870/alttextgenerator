import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

app.use(cors());
app.use(express.json());

/**
 * POST: Generate Alt Text with REAL image understanding
 */
app.post("/generate-alt-text", upload.single("image"), async (req, res) => {
  try {
    const { contextText, rules } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key missing" });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    /**
     * Core rules – force visual accuracy
     */
    const baseRules = `
You are an accessibility expert.

Write alt text that clearly and accurately describes ONLY what is visible.

STRICT RULES
Start with an article
Describe only visible objects shapes colors and positions
No guessing no interpretation no assumptions
Use American English
Limit below six hundred characters
Avoid the word image
Avoid possibly suggesting and similar words
Avoid quotes colons semicolons
Avoid unnecessary capitalization
`;

    const systemPrompt = `
${baseRules}

USER PROVIDED RULES
${rules || "None"}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `
Surrounding text for vocabulary reference
${contextText || "none"}

Describe the visual now.
`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    let altText = data.choices[0].message.content.trim();

    /**
     * Automatic validation
     */
    let warning = "";

    if (altText.length > 600) {
      warning = "Alt text exceeds six hundred characters";
    }

    if (/image|possibly|suggesting|\"|\'|:|;/i.test(altText)) {
      warning = warning
        ? warning + " and forbidden terms detected"
        : "Forbidden terms detected";
    }

    if (!/^(a |an |the )/i.test(altText)) {
      warning = warning
        ? warning + " and missing starting article"
        : "Alt text does not start with an article";
    }

    res.json({
      altText,
      length: altText.length,
      warning
    });

  } catch (error) {
    console.error("Vision error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("Alt Text Generator backend with vision is running");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
