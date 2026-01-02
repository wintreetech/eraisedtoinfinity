import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import formRoutes from "./routes/formRoutes.js";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

connectDB();

// ensure pdf folder exists
const pdfFolder = process.env.PDF_FOLDER || "./pdfs";
if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder, { recursive: true });

app.use("/api/form", formRoutes);

// serve pdf files
app.use("/public/pdf", express.static(pdfFolder, {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
