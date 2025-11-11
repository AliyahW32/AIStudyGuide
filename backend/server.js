import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");   // ← fixed
import mammoth from "mammoth";
import dotenv from "dotenv";
import OpenAI from "openai";


dotenv.config({ path: "./backend/.env" });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- ROUTE: Summarize uploaded note ----
app.post("/summarize", upload.single("file"), async (req, res) => {
  try {
    let fileContent = "";
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // STEP 1: Detect and extract
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

    // STEP 2: Handle empty text (common with scanned PDFs)
    if (!fileContent || fileContent.trim().length < 10) {
      return res.json({
        summary:
          "❌ No readable text found in this file. It might be a scanned or image-only PDF.",
      });
    }

    // STEP 3: Create prompt
    const prompt = `
    Summarize the following notes and highlight 3–5 key topics and insights:
    ${fileContent.slice(0, 5000)}  // limit for long PDFs
    `;

    // STEP 4: Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("🧠 OpenAI raw response:", completion);

    const summary =
      completion?.choices?.[0]?.message?.content ||
      completion?.choices?.[0]?.text ||
      "⚠️ OpenAI did not return a summary.";

    res.json({ summary });
  } catch (err) {
    console.error("❌ Error details:", err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(5000, () => console.log("✅ Server running on port 5000"));
