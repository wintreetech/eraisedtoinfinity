import PDFDocument from "pdfkit";
import fs from "fs";

function getStageMeta(vri) {
  if (vri <= 40) {
    return {
      emoji: "🔴",
      stage: "ANVESHAK STAGE — The Explorer",
      modern: "Foundation Stage",
      meaning:
        "Your business is in the foundation phase. Focus on clarifying direction, strengthening systems, and building early structure to unlock valuation growth.",
      accent: "#ef4444",
      light: "#fee2e2",
    };
  }
  if (vri <= 60) {
    return {
      emoji: "🟠",
      stage: "PRABANDHAK STAGE — The Organizer",
      modern: "Structured Stage",
      meaning:
        "Your business has basic structure in place. Strengthen management depth, governance, and repeatable execution to move toward scalable value creation.",
      accent: "#f59e0b",
      light: "#ffedd5",
    };
  }
  if (vri <= 80) {
    return {
      emoji: "🟢",
      stage: "VIKASHAK STAGE — The Scaler",
      modern: "Scalable Stage",
      meaning:
        "Your business has strong growth potential and market strength. With focused improvements in systems, management depth, and advisory support, the enterprise can unlock significantly higher valuation.",
      accent: "#10b981",
      light: "#d1fae5",
    };
  }
  return {
    emoji: "🟢🟢",
    stage: "VIJIGISHU STAGE — The Conqueror",
    modern: "Valuation Ready",
    meaning:
      "Your business shows high strategic maturity and valuation readiness. The next phase is expansion, stronger alliances, and institutional governance for long-term enterprise wealth.",
    accent: "#059669",
    light: "#a7f3d0",
  };
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roundedRect(doc, x, y, w, h, r, fillColor, strokeColor) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor);
  if (strokeColor) doc.strokeColor(strokeColor);
  doc.roundedRect(x, y, w, h, r);
  if (fillColor && strokeColor) doc.fillAndStroke();
  else if (fillColor) doc.fill();
  else doc.stroke();
  doc.restore();
}

export default function generatePDF(submission, outFilePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 }); // like your earlier PDF
      const stream = fs.createWriteStream(outFilePath);
      doc.pipe(stream);

      // Page setup
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const left = doc.page.margins.left;
      const right = pageW - doc.page.margins.right;
      const top = doc.page.margins.top;

      // Dynamic inputs
      const vri = Number(submission.VRI || 0);
      const meta = getStageMeta(vri);

      const company = submission.form?.companyName || "—";
      const industry = submission.form?.industry || submission.form?.businessType || "—";
      const assessmentDate = submission.form?.assessmentDate || formatDate(new Date());

      // ===== HEADER (like Page 1) =====
      // Brand icon
      doc
        .font("Helvetica-Bold")
        .fontSize(34)
        .fillColor("#111827")
        .text("∞", left, top - 5);

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#111827")
        .text("Valuation Readiness Report", left + 40, top);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6b7280")
        .text("by E Raised To Infinity", left + 40, top + 26);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111827")
        .text("Assessment Date:", right - 170, top + 8, { width: 170, align: "right" });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111827")
        .text(assessmentDate, right - 170, top + 22, { width: 170, align: "right" });

      // Divider line
      doc
        .moveTo(left, top + 55)
        .lineTo(right, top + 55)
        .lineWidth(1)
        .strokeColor("#e5e7eb")
        .stroke();

      // ===== META (Company, Industry) =====
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Company:", left, top + 75);
      doc.font("Helvetica").fontSize(11).fillColor("#111827").text(company, left + 70, top + 75, {
        width: right - (left + 70),
      });

      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Industry:", left, top + 95);
      doc.font("Helvetica").fontSize(11).fillColor("#111827").text(industry, left + 70, top + 95, {
        width: right - (left + 70),
      });

      // Intro paragraph box
      roundedRect(doc, left, top + 120, right - left, 62, 10, "#ffffff", "#d1d5db");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(
          "This report is generated based on responses provided by the founder through the Value Enhancement Assessment, designed to evaluate strategic maturity and value creation potential.",
          left + 14,
          top + 135,
          { width: right - left - 28, align: "left" }
        );

      // ===== SECTION 2: Overall Score (Dynamic) =====
      const boxY = top + 200;
      roundedRect(doc, left, boxY, right - left, 250, 14, "#ffffff", "#e5e7eb");

      // Section title row
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#111827")
        .text("Valuation Assessment Overall Score", left + 18, boxY + 18);

      // Score badge (right)
      roundedRect(doc, right - 120, boxY + 12, 100, 48, 12, meta.light, "#cbd5e1");
      doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor("#111827")
        .text(`${vri}%`, right - 120, boxY + 22, { width: 100, align: "center" });

      // Stage block
      roundedRect(doc, left + 18, boxY + 80, right - left - 36, 62, 12, "#ffffff", "#e5e7eb");
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text("Chanakya Stage Classification:", left + 32, boxY + 98);

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text(`${meta.emoji} ${meta.stage}`, left + 220, boxY + 95, {
          width: right - left - 250,
        });

      // Modern interpretation line
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text("Modern Interpretation:", left + 18, boxY + 155);

      // modern pill
      const pillW = 160;
      roundedRect(doc, left + 150, boxY + 147, pillW, 22, 11, meta.light, meta.accent);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111827")
        .text(meta.modern, left + 150, boxY + 152, { width: pillW, align: "center" });

      // Meaning
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text("What it means:", left + 18, boxY + 185);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(meta.meaning, left + 18, boxY + 202, { width: right - left - 36 });

      // ===== STATIC CONTENT (rest of page) =====
      const staticY = boxY + 270;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#111827")
        .text("Strategic Analysis (Static)", left, staticY);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(
          "This assessment evaluates your business across Chanakya’s seven strategic pillars. A strong valuation is created when these pillars work in harmony. Weakness in even one pillar can limit scalability, investor confidence, and valuation multiples—while strength across multiple pillars enhances enterprise value.",
          left,
          staticY + 18,
          { width: right - left }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text("Recommended Next Step (Static)", left, staticY + 80);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(
          "Book a 1:1 Valuation Enhancement Consultation to convert your report into a clear 12–18 month execution roadmap.",
          left,
          staticY + 98,
          { width: right - left }
        );

      // Footer
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6b7280")
        .text("For more information: Contact us • Phone & email", left, pageH - 60, {
          width: right - left,
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(outFilePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
