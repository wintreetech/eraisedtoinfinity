import Submission from "../models/Submission.js";
import { calculateVRIFromAnswers } from "../utils/calculateScore.js";
import generatePDF from "../utils/generatePDF.js";
import path from "path";
import fs from "fs";

export const submitForm = async (req, res) => {
  try {
    const { form, answers: answersRaw } = req.body;

    if (!form || !answersRaw || !Array.isArray(answersRaw)) {
      return res.status(400).json({ message: "form and answers array required" });
    }

    // 1) Rule-based scoring
    const scoring = calculateVRIFromAnswers(answersRaw);

    // 2) Save submission in DB
    const submission = await Submission.create({
      form,
      answers: answersRaw,
      totalScore: scoring.totalScore,
      VRI: scoring.VRI,
      category: scoring.category,
      interpretation: scoring.interpretation,
    });

    // 3) Ensure PDF folder exists (SYNC - IMPORTANT)
    const pdfFolder = process.env.PDF_FOLDER || path.resolve("./pdfs");
    if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

    // 4) Create PDF filepath
    const fileName = `valuation-report-${submission._id}.pdf`;
    const outPath = path.join(pdfFolder, fileName);

    // 5) Generate PDF
    await generatePDF(
      {
        form,
        answers: answersRaw,
        totalScore: scoring.totalScore,
        VRI: scoring.VRI,
        category: scoring.category,
        interpretation: scoring.interpretation,
      },
      outPath
    );

    // 6) Public URL (make sure your express serves pdfFolder at /public/pdf)
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const publicUrl = `${baseUrl}/public/pdf/${fileName}`;

    submission.pdfPath = publicUrl;
    await submission.save();

    return res.json({
      message: "Submission saved",
      id: submission._id,
      pdfUrl: publicUrl,
      scoring,
    });
  } catch (err) {
    console.error("submitForm err:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
