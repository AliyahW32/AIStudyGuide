// backend/routes/aiRoutes.js

import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import OpenAI from "openai";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== ROUTE: Summarize Uploaded File =====
router.post("/summarize", upload.single("file"), async (req, res) => {
  try {
    let fileContent = "";
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // ---- Handle file types ----
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      fileContent = pdfData.text;
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      fileContent = result.value;
    } else {
      fileContent = fs.readFileSync(filePath, "utf8");
    }

    console.log("📝 Extracted text preview:", fileContent.slice(0, 200));

    if (!fileContent || fileContent.trim().length < 10) {
      return res.json({
        summary:
          "❌ No readable text found in this file. Try uploading a text-based file.",
      });
    }

    const prompt = `
    Summarize the following notes and highlight 3–5 key topics and insights:
    ${fileContent.slice(0, 5000)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      completion?.choices?.[0]?.message?.content ||
      completion?.choices?.[0]?.text ||
      "⚠️ No summary returned from OpenAI.";

    res.json({ summary });
  } catch (err) {
    console.error("❌ Error details:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
