import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

/** ===== ESM dirname ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** ===== Font paths (LOCAL) ===== */
const FONT_DIR = path.resolve(__dirname, "../assets/fonts");
const FONTS = {
  regular: path.join(FONT_DIR, "Poppins-Regular.ttf"),
  medium: path.join(FONT_DIR, "Poppins-Medium.ttf"),
  semibold: path.join(FONT_DIR, "Poppins-SemiBold.ttf"),
  bold: path.join(FONT_DIR, "Poppins-Bold.ttf"),
};

/** ===== Dynamic stage meta ===== */
function getStageMeta(vri) {
  if (vri <= 40) {
    return {
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
      stage: "VIKASHAK STAGE — The Scaler",
      modern: "Scalable Stage",
      meaning:
        "Your business has strong growth potential and market strength. With focused improvements in systems, management depth, and advisory support, the enterprise can unlock significantly higher valuation.",
      accent: "#10b981",
      light: "#d1fae5",
    };
  }
  return {
    stage: "VIJIGISHU STAGE — The Conqueror",
    modern: "Valuation Ready",
    meaning:
      "Your business shows high strategic maturity and valuation readiness. The next phase is expansion, stronger alliances, and institutional governance for long-term enterprise wealth.",
    accent: "#059669",
    light: "#a7f3d0",
  };
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** ===== Helpers ===== */
function roundedRect(doc, x, y, w, h, r, fillColor, strokeColor, lineWidth = 1) {
  doc.save();
  doc.lineWidth(lineWidth);
  if (fillColor) doc.fillColor(fillColor);
  if (strokeColor) doc.strokeColor(strokeColor);
  doc.roundedRect(x, y, w, h, r);
  if (fillColor && strokeColor) doc.fillAndStroke();
  else if (fillColor) doc.fill();
  else doc.stroke();
  doc.restore();
}

function dashedRoundedRect(doc, x, y, w, h, r, strokeColor, dash = [2, 3], lineWidth = 1) {
  doc.save();
  doc.lineWidth(lineWidth);
  doc.strokeColor(strokeColor);
  doc.dash(dash[0], { space: dash[1] });
  doc.roundedRect(x, y, w, h, r).stroke();
  doc.undash();
  doc.restore();
}

function hLine(doc, x1, x2, y, color = "#111827", width = 2) {
  doc.save();
  doc.strokeColor(color).lineWidth(width);
  doc.moveTo(x1, y).lineTo(x2, y).stroke();
  doc.restore();
}

function dot(doc, x, y, radius, color) {
  doc.save();
  doc.fillColor(color);
  doc.circle(x, y, radius).fill();
  doc.restore();
}

function setFont(doc, weight = "regular") {
  if (weight === "bold") return doc.font("Poppins-Bold");
  if (weight === "semibold") return doc.font("Poppins-SemiBold");
  if (weight === "medium") return doc.font("Poppins-Medium");
  return doc.font("Poppins-Regular");
}

/** ===== Static rows (Page 1 table like SVG) ===== */
function getStaticPillarRows() {
  return [
    { pillar: "Swami (Leadership & Vision)", score: "4.0", status: "Strength" },
    { pillar: "Amatya (Management & Team)", score: "2.0", status: "Value Enhancement Opportunity" },
    { pillar: "Janapada (Market & Customers)", score: "4.0", status: "Strength" },
    { pillar: "Durga (Systems & Infrastructure)", score: "2.0", status: "Value Enhancement Opportunity" },
    { pillar: "Kosha (Finance & Capital)", score: "3.0", status: "Strength" },
    { pillar: "Danda (Execution & Governance)", score: "3.0", status: "Strength" },
    { pillar: "Mitra (Advisors & Alliances)", score: "2.0", status: "Value Enhancement Opportunity" },
  ];
}

async function fetchImageBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

/** ===== Layout frame ===== */
function drawFrame(doc) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const framePad = 12;
  const left = doc.page.margins.left;
  const top = doc.page.margins.top;
  const right = pageW - doc.page.margins.right;
  const bottom = pageH - doc.page.margins.bottom;

  const frameX = left - framePad;
  const frameY = top - framePad;
  const frameW = (right - left) + framePad * 2;
  const frameH = (bottom - top) + framePad * 2;

  roundedRect(doc, frameX, frameY, frameW, frameH, 18, "#ffffff", "#111827", 2);
  return { pageW, pageH, framePad, left, top, right, bottom, frameX, frameY, frameW, frameH };
}

/** ===== Header ===== */
function drawHeader(doc, layout, assets) {
  const { left, top, frameX, frameW } = layout;

  // Logo
  if (assets?.logoBuffer) {
    try {
      doc.image(assets.logoBuffer, left, top + 14, { height: 40 });
    } catch {
      setFont(doc, "bold").fontSize(44).fillColor("#111827").text("∞", left, top + 8);
    }
  } else {
    setFont(doc, "bold").fontSize(44).fillColor("#111827").text("∞", left, top + 8);
  }

  setFont(doc, "bold").fontSize(22).fillColor("#111827").text(
    "Valuation Readiness Report",
    left + 70,
    top + 18
  );

  setFont(doc, "regular").fontSize(11).fillColor("#111827").text(
    "by E Raised To Infinity",
    left + 70,
    top + 44
  );

  const headerBottomY = top + 78;
  hLine(doc, frameX, frameX + frameW, headerBottomY, "#111827", 2);
  return headerBottomY;
}

/** ===== Footer ===== */
function getFooterMetrics(doc, layout) {
  const { bottom } = layout;

  const fontSize = 9.5;
  const paddingTop = 10;
  const paddingBottom = 10;

  const footerText =
    "For more information: Mr. Kamlesh B | kamlesh@eraisedtoinfinity.com | +91 96194 15535";

  setFont(doc, "regular").fontSize(fontSize);

  const textHeight = doc.heightOfString(footerText, {
    width: layout.right - layout.left,
    align: "center",
  });

  // Divider line Y (calculated so text always fits below it)
  const footerLineY = bottom - (textHeight + paddingTop + paddingBottom + 12);

  return { footerLineY, footerText, fontSize, paddingTop };
}

function drawFooter(doc, layout) {
  const { left, right, frameX, frameW } = layout;

  const { footerLineY, footerText, fontSize, paddingTop } = getFooterMetrics(doc, layout);

  // Divider line
  hLine(doc, frameX, frameX + frameW, footerLineY, "#111827", 2);

  // Single line footer
  setFont(doc, "regular").fontSize(fontSize).fillColor("#111827").text(
    footerText,
    left,
    footerLineY + paddingTop,
    { width: right - left, align: "center" }
  );

  return footerLineY; // IMPORTANT: return divider position so page content can stop above it
}

/** ===== PAGE 1 ===== */
function renderPage1(doc, submission, assets = {}) {
  const layout = drawFrame(doc);
  const vri = Number(submission.VRI || 0);
  const meta = getStageMeta(vri);

  const company = submission.form?.companyName || "—";
  const industry = submission.form?.industry || submission.form?.businessType || "—";
  const assessmentDate = submission.form?.assessmentDate || formatDate(new Date());

  const headerBottomY = drawHeader(doc, layout, assets);

  // Meta row
  const metaY = headerBottomY + 14;
  setFont(doc, "regular").fontSize(10.5).fillColor("#111827");
  doc.text(`Company: ${company}`, layout.left, metaY);
  doc.text(`Industry: ${industry}`, layout.left, metaY + 18);
  doc.text(`Assessment Date: ${assessmentDate}`, layout.right - 240, metaY, {
    width: 240,
    align: "right",
  });

  // Intro dashed box
  const introY = metaY + 44;
  const introH = 62;
  dashedRoundedRect(doc, layout.left, introY, layout.right - layout.left, introH, 10, "#9ca3af", [2, 4], 1);

  setFont(doc, "regular").fontSize(10.5).fillColor("#111827").text(
    "This report is generated based on responses provided by the founder through\n" +
      "the Value Enhancement Assessment, designed to evaluate strategic maturity\n" +
      "and value creation potential.",
    layout.left + 12,
    introY + 12,
    { width: layout.right - layout.left - 24, lineGap: 3 }
  );

  const afterIntroY = introY + introH + 16;
  hLine(doc, layout.frameX, layout.frameX + layout.frameW, afterIntroY, "#111827", 2);

  // Section 2 dynamic
  const scoreBoxY = afterIntroY + 14;
  const scoreBoxH = 250;
  roundedRect(doc, layout.left, scoreBoxY, layout.right - layout.left, scoreBoxH, 14, "#ffffff", "#111827", 1.5);

  setFont(doc, "bold").fontSize(15).fillColor("#111827").text(
    "Valuation Assessment Overall Score",
    layout.left + 18,
    scoreBoxY + 18
  );

  // premium score badge
  roundedRect(doc, layout.right - 145, scoreBoxY + 10, 130, 58, 12, meta.light, "#111827", 1);
  setFont(doc, "bold").fontSize(32).fillColor("#111827").text(
    `${vri}%`,
    layout.right - 145,
    scoreBoxY + 22,
    { width: 130, align: "center" }
  );

  hLine(doc, layout.left, layout.right, scoreBoxY + 76, "#111827", 1.5);

  // Stage strip (no emoji; colored dot + text)
  const stageStripY = scoreBoxY + 90;
  roundedRect(doc, layout.left + 14, stageStripY, layout.right - layout.left - 28, 46, 10, "#ffffff", meta.accent, 1);

  setFont(doc, "regular").fontSize(10.5).fillColor("#111827").text(
    "Chanakya Stage\nClassification:",
    layout.left + 26,
    stageStripY + 10,
    { width: 150 }
  );

  // Colored dot
  dot(doc, layout.left + 190, stageStripY + 24, 5, meta.accent);
  setFont(doc, "semibold").fontSize(13).fillColor("#111827").text(
    meta.stage,
    layout.left + 205,
    stageStripY + 14,
    { width: layout.right - layout.left - 220 }
  );

  setFont(doc, "medium").fontSize(10.5).fillColor("#111827").text(
    "Modern Interpretation:",
    layout.left + 18,
    scoreBoxY + 152
  );
  setFont(doc, "regular").text(meta.modern, layout.left + 165, scoreBoxY + 152);

  setFont(doc, "medium").text("What it means:", layout.left + 18, scoreBoxY + 178);
  setFont(doc, "regular").text(meta.meaning, layout.left + 18, scoreBoxY + 198, {
    width: layout.right - layout.left - 36,
    lineGap: 3,
  });

  const afterScoreY = scoreBoxY + scoreBoxH + 16;
  hLine(doc, layout.frameX, layout.frameX + layout.frameW, afterScoreY, "#111827", 2);

  // Static Pillar-wise Scorecard
  const tableBoxY = afterScoreY + 14;
  const tableBoxH = 200;
  roundedRect(doc, layout.left, tableBoxY, layout.right - layout.left, tableBoxH, 14, "#ffffff", "#111827", 1.5);

  setFont(doc, "bold").fontSize(14).fillColor("#111827").text(
    "Pillar-wise Scorecard (Chanakya Saptang)",
    layout.left + 18,
    tableBoxY + 16
  );

  hLine(doc, layout.left, layout.right, tableBoxY + 44, "#111827", 1.5);

  const rows = getStaticPillarRows();
  const gridX = layout.left + 14;
  const gridY = tableBoxY + 54;
  const gridW = (layout.right - layout.left) - 28;
  const rowH = 18;
  const headerH = 20;

  const col1 = Math.round(gridW * 0.44);
  const col2 = Math.round(gridW * 0.16);
  const col3 = gridW - col1 - col2;

  doc.save();
  doc.lineWidth(0.8).strokeColor("#111827");

  doc.rect(gridX, gridY, gridW, headerH).stroke();
  doc.rect(gridX, gridY, col1, headerH).stroke();
  doc.rect(gridX + col1, gridY, col2, headerH).stroke();
  doc.rect(gridX + col1 + col2, gridY, col3, headerH).stroke();

  setFont(doc, "semibold").fontSize(10).fillColor("#111827");
  doc.text("Pillar", gridX, gridY + 5, { width: col1, align: "center" });
  doc.text("Score (1–5)", gridX + col1, gridY + 5, { width: col2, align: "center" });
  doc.text("Status", gridX + col1 + col2, gridY + 5, { width: col3, align: "center" });

  setFont(doc, "regular").fontSize(9.5).fillColor("#111827");
  rows.forEach((r, i) => {
    const y = gridY + headerH + i * rowH;
    doc.rect(gridX, y, gridW, rowH).stroke();
    doc.rect(gridX, y, col1, rowH).stroke();
    doc.rect(gridX + col1, y, col2, rowH).stroke();
    doc.rect(gridX + col1 + col2, y, col3, rowH).stroke();

    setFont(doc, "semibold").text(r.pillar, gridX + 6, y + 4, { width: col1 - 12 });
    setFont(doc, "regular").text(r.score, gridX + col1, y + 4, { width: col2, align: "center" });
    setFont(doc, "regular").text(r.status, gridX + col1 + col2 + 6, y + 4, { width: col3 - 12 });
  });

  doc.restore();
  drawFooter(doc, layout);
}

/** ===== PAGE 2 (STATIC like your SVG) ===== */
function renderPage2(doc, assets = {}) {
  const layout = drawFrame(doc);
  const headerBottomY = drawHeader(doc, layout, assets);

  // Compute EXACT footer divider position (dynamic)
  const footerLineY = getFooterMetrics(doc, layout).footerLineY;

  // Content must stop above footer divider
  const contentBottom = footerLineY - 14; // breathing space above the divider

  doc.y = headerBottomY + 26;

  function writeSection(title, body, titleSize = 18, bodySize = 12) {
    setFont(doc, "bold").fontSize(titleSize).fillColor("#111827");

    const titleH = doc.heightOfString(title, { width: layout.right - layout.left });
    if (doc.y + titleH > contentBottom) return false;

    doc.text(title, layout.left, doc.y, { width: layout.right - layout.left });
    doc.moveDown(0.6);

    setFont(doc, "regular").fontSize(bodySize).fillColor("#111827");

    let bodyH = doc.heightOfString(body, {
      width: layout.right - layout.left,
      lineGap: 3,
    });

    // Reduce font slightly if needed, but NEVER cross footer line
    if (doc.y + bodyH > contentBottom) {
      bodySize = 11;
      setFont(doc, "regular").fontSize(bodySize);
      bodyH = doc.heightOfString(body, { width: layout.right - layout.left, lineGap: 3 });
    }

    if (doc.y + bodyH > contentBottom) return false;

    doc.text(body, layout.left, doc.y, {
      width: layout.right - layout.left,
      lineGap: 3,
    });

    doc.moveDown(1.0);
    return true;
  }

  // --- Content ---
  writeSection(
    "Strategic Analysis",
    "This assessment evaluates your business across the seven strategic pillars of Chanakya’s Saptang, each of which directly influences long-term business valuation.\n\nYour scores indicate that while leadership vision, market opportunity, and financial discipline are strong, certain structural pillars need strengthening to fully support scalable growth and higher valuation multiples."
  );

  writeSection(
    "Valuation Enhancement Analysis",
    "Your vision and market opportunity are strong, but management and systems need strengthening to unlock higher valuation.\nMarket demand exists, yet process digitization and delegation are required to scale efficiently.\nFinancial readiness is present, but advisory support will significantly enhance investor confidence."
  );

  // Priority actions title
  setFont(doc, "bold").fontSize(18).fillColor("#111827");
  const actionsTitle = "Priority Value Enhancement Actions";
  if (doc.y + doc.heightOfString(actionsTitle, { width: layout.right - layout.left }) < contentBottom) {
    doc.text(actionsTitle, layout.left, doc.y, { width: layout.right - layout.left });
    doc.moveDown(0.6);

    setFont(doc, "semibold").fontSize(12).fillColor("#111827");
    const actions = ["Value Enhancement Roadmap (Next Phase)", "Recommended Next Step"];

    actions.forEach((t) => {
      const lineH = doc.heightOfString(t, { width: layout.right - layout.left - 18 });
      if (doc.y + lineH > contentBottom) return;
      dot(doc, layout.left + 6, doc.y + 6, 3.5, "#22c55e");
      doc.text(t, layout.left + 18, doc.y, { width: layout.right - layout.left - 18 });
      doc.moveDown(0.6);
    });

    doc.moveDown(0.8);
  }

  // Closing thought
  const closingTitle = "Closing Thought";
  const closingBody =
    "Valuation is not just about today’s profit — it’s about building a business that can scale beyond the founder, run on systems, and earn investor-grade confidence.";

  setFont(doc, "bold").fontSize(18).fillColor("#111827");
  if (doc.y + doc.heightOfString(closingTitle, { width: layout.right - layout.left }) < contentBottom) {
    doc.text(closingTitle, layout.left, doc.y, { width: layout.right - layout.left });
    doc.moveDown(0.3);

    setFont(doc, "regular").fontSize(12).fillColor("#111827");
    const closingH = doc.heightOfString(closingBody, { width: layout.right - layout.left, lineGap: 3 });
    if (doc.y + closingH < contentBottom) {
      doc.text(closingBody, layout.left, doc.y, { width: layout.right - layout.left, lineGap: 3 });
    }
  }

  // Footer LAST
  drawFooter(doc, layout);
}



/** ===== Export ===== */
export default function generatePDF(submission, outFilePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const stream = fs.createWriteStream(outFilePath);
      doc.pipe(stream);

      // Register Poppins fonts (IMPORTANT)
      doc.registerFont("Poppins-Regular", FONTS.regular);
      doc.registerFont("Poppins-Medium", FONTS.medium);
      doc.registerFont("Poppins-SemiBold", FONTS.semibold);
      doc.registerFont("Poppins-Bold", FONTS.bold);

      // Default font
      setFont(doc, "regular");

      // Logo
      const logoUrl = "https://eraisedtoinfinity.com/wp-content/uploads/2025/10/einfinity-logo-final.png";
      let logoBuffer = null;
      try {
        logoBuffer = await fetchImageBuffer(logoUrl);
      } catch {
        logoBuffer = null;
      }

      renderPage1(doc, submission, { logoBuffer });

      doc.addPage();
      renderPage2(doc, { logoBuffer });

      doc.end();

      stream.on("finish", () => resolve(outFilePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
