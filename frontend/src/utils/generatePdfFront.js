// src/utils/generatePdfFront.js
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const A4 = { w: 595.28, h: 841.89 }; // points

function hexToRgb01(hex) {
  const h = String(hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}
function c(hex) {
  const { r, g, b } = hexToRgb01(hex);
  return rgb(r, g, b);
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** pdf-lib doesn't wrap; wrap manually */
function wrapText(text, font, fontSize, maxWidth) {
  const paragraphs = String(text || "").split("\n");
  const lines = [];
  for (const p of paragraphs) {
    if (p.trim() === "") {
      lines.push("");
      continue;
    }
    const words = p.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawLine(page, x1, y1, x2, y2, color, thickness = 2) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
}

function drawRect(page, x, y, w, h, opts) {
  page.drawRectangle({ x, y, width: w, height: h, ...opts });
}

const MARGIN = 40;
const FRAME_PAD = 12;

function layoutBox() {
  const left = MARGIN;
  const right = A4.w - MARGIN;
  const top = A4.h - MARGIN;
  const bottom = MARGIN;

  const frameX = left - FRAME_PAD;
  const frameY = bottom - FRAME_PAD;
  const frameW = right - left + FRAME_PAD * 2;
  const frameH = top - bottom + FRAME_PAD * 2;

  return { left, right, top, bottom, frameX, frameY, frameW, frameH };
}

function drawFrame(page) {
  const { frameX, frameY, frameW, frameH } = layoutBox();
  drawRect(page, frameX, frameY, frameW, frameH, {
    borderColor: c("#111827"),
    borderWidth: 2,
    color: c("#ffffff"),
  });
  return layoutBox();
}

function drawHeader(page, fonts, assets) {
  const { left, top, frameX, frameW } = layoutBox();

  // Logo / fallback ∞
  if (assets?.logoImage) {
    page.drawImage(assets.logoImage, { x: left, y: top - 14 - 40, height: 40, width: 40 });
  } else {
    page.drawText("∞", {
      x: left,
      y: top - 8 - 44,
      size: 44,
      font: fonts.bold,
      color: c("#111827"),
    });
  }

  page.drawText("Valuation Readiness Report", {
    x: left + 70,
    y: top - 18 - 22,
    size: 22,
    font: fonts.bold,
    color: c("#111827"),
  });

  page.drawText("by E Raised To Infinity", {
    x: left + 70,
    y: top - 44 - 11,
    size: 11,
    font: fonts.regular,
    color: c("#111827"),
  });

  const headerBottomY = top - 78;
  drawLine(page, frameX, headerBottomY, frameX + frameW, headerBottomY, c("#111827"), 2);
  return headerBottomY;
}

function footerMetrics(fonts) {
  const { left, right, bottom } = layoutBox();
  const footerText =
    "For more information: Mr. Kamlesh B | kamlesh@eraisedtoinfinity.com | +91 96194 15535";

  const fontSize = 9.5;
  const paddingTop = 10;
  const paddingBottom = 10;

  const textH = fontSize + 2;
  const footerLineY = bottom + (textH + paddingTop + paddingBottom + 12);

  return { footerLineY, footerText, fontSize, paddingTop, maxW: right - left };
}

function drawFooter(page, fonts) {
  const { left, right, frameX, frameW } = layoutBox();
  const { footerLineY, footerText, fontSize, paddingTop } = footerMetrics(fonts);

  drawLine(page, frameX, footerLineY, frameX + frameW, footerLineY, c("#111827"), 2);

  const textW = fonts.regular.widthOfTextAtSize(footerText, fontSize);
  const x = left + ((right - left) - textW) / 2;

  page.drawText(footerText, {
    x,
    y: footerLineY - paddingTop - fontSize,
    size: fontSize,
    font: fonts.regular,
    color: c("#111827"),
  });

  return footerLineY;
}

function drawDot(page, x, y, r, colorHex) {
  page.drawCircle({ x, y, size: r, color: c(colorHex) });
}

function drawTable(page, fonts, gridX, gridTop, gridW, headerH, rowH, rows) {
  const col1 = Math.round(gridW * 0.44);
  const col2 = Math.round(gridW * 0.16);
  const col3 = gridW - col1 - col2;

  const stroke = c("#111827");

  const headerBottom = gridTop - headerH;

  // header rect
  drawRect(page, gridX, headerBottom, gridW, headerH, {
    borderColor: stroke,
    borderWidth: 0.8,
  });

  // separators
  drawLine(page, gridX + col1, headerBottom, gridX + col1, gridTop, stroke, 0.8);
  drawLine(page, gridX + col1 + col2, headerBottom, gridX + col1 + col2, gridTop, stroke, 0.8);

  const headSize = 10;
  const headY = headerBottom + (headerH - headSize) / 2;

  const t1 = "Pillar";
  const t2 = "Score (1–5)";
  const t3 = "Status";

  page.drawText(t1, {
    x: gridX + (col1 - fonts.semibold.widthOfTextAtSize(t1, headSize)) / 2,
    y: headY,
    size: headSize,
    font: fonts.semibold,
    color: c("#111827"),
  });
  page.drawText(t2, {
    x: gridX + col1 + (col2 - fonts.semibold.widthOfTextAtSize(t2, headSize)) / 2,
    y: headY,
    size: headSize,
    font: fonts.semibold,
    color: c("#111827"),
  });
  page.drawText(t3, {
    x: gridX + col1 + col2 + (col3 - fonts.semibold.widthOfTextAtSize(t3, headSize)) / 2,
    y: headY,
    size: headSize,
    font: fonts.semibold,
    color: c("#111827"),
  });

  const bodySize = 9.5;

  rows.forEach((r, i) => {
    const top = headerBottom - i * rowH;
    const bottom = top - rowH;

    drawRect(page, gridX, bottom, gridW, rowH, { borderColor: stroke, borderWidth: 0.8 });
    drawLine(page, gridX + col1, bottom, gridX + col1, top, stroke, 0.8);
    drawLine(page, gridX + col1 + col2, bottom, gridX + col1 + col2, top, stroke, 0.8);

    page.drawText(r.pillar, {
      x: gridX + 6,
      y: bottom + (rowH - bodySize) / 2,
      size: bodySize,
      font: fonts.semibold,
      color: c("#111827"),
      maxWidth: col1 - 12,
    });

    const sW = fonts.regular.widthOfTextAtSize(r.score, bodySize);
    page.drawText(r.score, {
      x: gridX + col1 + (col2 - sW) / 2,
      y: bottom + (rowH - bodySize) / 2,
      size: bodySize,
      font: fonts.regular,
      color: c("#111827"),
    });

    page.drawText(r.status, {
      x: gridX + col1 + col2 + 6,
      y: bottom + (rowH - bodySize) / 2,
      size: bodySize,
      font: fonts.regular,
      color: c("#111827"),
      maxWidth: col3 - 12,
    });
  });
}

function renderPage1(page, submission, fonts, assets) {
  const layout = drawFrame(page);

  const vri = Number(submission?.VRI || 0);
  const meta = getStageMeta(vri);

  const company = submission?.form?.companyName || "—";
  const industry =
    submission?.form?.industry || submission?.form?.businessType || "—";
  const assessmentDate =
    submission?.form?.assessmentDate || formatDate(new Date());

  const headerBottomY = drawHeader(page, fonts, assets);

  // ===== Helpers for better alignment =====
  const text = (str, x, y, size, font, color = c("#111827")) => {
    page.drawText(String(str), { x, y, size, font, color });
  };

  // Draw text where (x,y) is TOP-left (like CSS), not baseline
  const textTop = (str, x, topY, size, font, color = c("#111827"), maxWidth) => {
    const y = topY - size; // convert top to baseline
    page.drawText(String(str), { x, y, size, font, color, maxWidth });
    return topY - (size + 2);
  };

  const centerTextInBox = (str, boxX, boxY, boxW, boxH, size, font, color) => {
    const w = font.widthOfTextAtSize(str, size);
    const x = boxX + (boxW - w) / 2;
    const y = boxY + (boxH - size) / 2; // baseline-ish centering
    page.drawText(str, { x, y, size, font, color });
  };

  // ===== Meta Row =====
  const metaTop = headerBottomY - 14;

  textTop(`Company: ${company}`, layout.left, metaTop, 10.5, fonts.regular);
  textTop(`Industry: ${industry}`, layout.left, metaTop - 18, 10.5, fonts.regular);

  const rightText = `Assessment Date: ${assessmentDate}`;
  const rtSize = 10.5;
  const rtW = fonts.regular.widthOfTextAtSize(rightText, rtSize);
  textTop(rightText, layout.right - rtW, metaTop, rtSize, fonts.regular);

  // ===== Intro Box =====
  const introTop = metaTop - 44;
  const introH = 62;

  drawRect(page, layout.left, introTop - introH, layout.right - layout.left, introH, {
    borderColor: c("#D1D5DB"), // gray-300
    borderWidth: 1,
    color: c("#FFFFFF"),
  });

  const introText =
    "This report is generated based on responses provided by the founder through\n" +
    "the Value Enhancement Assessment, designed to evaluate strategic maturity\n" +
    "and value creation potential.";

  let yCursor = introTop - 12;
  for (const line of introText.split("\n")) {
    yCursor = textTop(line, layout.left + 12, yCursor, 10.5, fonts.regular);
    yCursor -= 1;
  }

  const afterIntroY = introTop - introH - 16;
  drawLine(page, layout.frameX, afterIntroY, layout.frameX + layout.frameW, afterIntroY, c("#111827"), 2);

  // ===== Score Box =====
  const scoreBoxTop = afterIntroY - 14;
  const scoreBoxH = 250;
  const scoreBoxW = layout.right - layout.left;

  drawRect(page, layout.left, scoreBoxTop - scoreBoxH, scoreBoxW, scoreBoxH, {
    borderColor: c("#111827"),
    borderWidth: 1.5,
    color: c("#FFFFFF"),
  });

  // Title
  textTop("Valuation Assessment Overall Score", layout.left + 18, scoreBoxTop - 18, 15, fonts.bold);

  // ===== Badge (FIXED CENTERING) =====
  const badgeW = 130;
  const badgeH = 58;
  const badgeX = layout.right - 145;
  const badgeY = scoreBoxTop - 10 - badgeH; // bottom-left y of badge rectangle

  drawRect(page, badgeX, badgeY, badgeW, badgeH, {
    borderColor: c("#111827"),
    borderWidth: 1,
    color: c(meta.light),
  });

  // show same as UI: 2 decimals (or round if you want)
  const vText = `${Math.round(vri)}%`;
  centerTextInBox(vText, badgeX, badgeY, badgeW, badgeH, 32, fonts.bold, c("#111827"));

  // Divider inside score box
  const scoreDividerY = scoreBoxTop - 76;
  drawLine(page, layout.left, scoreDividerY, layout.right, scoreDividerY, c("#111827"), 1.5);

  // ===== Stage Strip =====
  const stageStripTop = scoreBoxTop - 90;
  const stageStripH = 46;

  drawRect(page, layout.left + 14, stageStripTop - stageStripH, scoreBoxW - 28, stageStripH, {
    borderColor: c(meta.accent),
    borderWidth: 1,
    color: c("#FFFFFF"),
  });

  // left label (two lines)
  let labelTop = stageStripTop - 10;
  labelTop = textTop("Chanakya Stage", layout.left + 26, labelTop, 10.5, fonts.regular);
  textTop("Classification:", layout.left + 26, labelTop + 2, 10.5, fonts.regular);

  // dot + stage text
  drawDot(page, layout.left + 190, stageStripTop - 24, 5, meta.accent);

  textTop(meta.stage, layout.left + 205, stageStripTop - 14, 13, fonts.semibold);

  // Modern interpretation row
  textTop("Modern Interpretation:", layout.left + 18, scoreBoxTop - 152, 10.5, fonts.medium);
  textTop(meta.modern, layout.left + 165, scoreBoxTop - 152, 10.5, fonts.regular);

  // What it means
  textTop("What it means:", layout.left + 18, scoreBoxTop - 178, 10.5, fonts.medium);

  const meaningMaxW = scoreBoxW - 36;
  const meaningSize = 10.5;
  const meaningLines = wrapText(meta.meaning, fonts.regular, meaningSize, meaningMaxW);

  // Bound meaning inside score box (so it never spills)
  const meaningTop = scoreBoxTop - 198;
  const meaningBottom = scoreBoxTop - scoreBoxH + 14; // leave padding inside box

  let myTop = meaningTop;
  for (const line of meaningLines) {
    const nextBaseline = myTop - meaningSize;
    if (nextBaseline < meaningBottom) break; // stop if we'd overflow box
    textTop(line, layout.left + 18, myTop, meaningSize, fonts.regular, c("#111827"), meaningMaxW);
    myTop -= 14;
  }

  // Divider after score box
  const afterScoreY = scoreBoxTop - scoreBoxH - 16;
  drawLine(page, layout.frameX, afterScoreY, layout.frameX + layout.frameW, afterScoreY, c("#111827"), 2);

  // ===== Table Box =====
  const tableBoxTop = afterScoreY - 14;
  const tableBoxH = 200;
  drawRect(page, layout.left, tableBoxTop - tableBoxH, scoreBoxW, tableBoxH, {
    borderColor: c("#111827"),
    borderWidth: 1.5,
    color: c("#FFFFFF"),
  });

  textTop(
    "Pillar-wise Scorecard (Chanakya Saptang)",
    layout.left + 18,
    tableBoxTop - 16,
    14,
    fonts.bold
  );

  drawLine(page, layout.left, tableBoxTop - 44, layout.right, tableBoxTop - 44, c("#111827"), 1.5);

  const rows = getStaticPillarRows();
  const gridX = layout.left + 14;
  const gridTop = tableBoxTop - 54;
  const gridW = scoreBoxW - 28;
  const rowH = 18;
  const headerH = 20;

  drawTable(page, fonts, gridX, gridTop, gridW, headerH, rowH, rows);

  // Footer last
  drawFooter(page, fonts);
}

function renderPage2(page, fonts, assets) {
  const layout = drawFrame(page);
  const headerBottomY = drawHeader(page, fonts, assets);

  // Footer safety boundary
  const footerLineY = footerMetrics(fonts).footerLineY;
  const contentMinY = footerLineY + 22; // leave clear gap above footer divider

  // Cursor starts below header
  let y = headerBottomY - 28;

  const sectionPad = 14;
  const sectionGap = 18;

  // Draw a soft section container (no rounded corners to keep pdf-lib stable)
  function drawSectionBox(topY, height) {
    drawRect(page, layout.left, topY - height, layout.right - layout.left, height, {
      borderColor: c("#E5E7EB"), // gray-200
      borderWidth: 1,
      color: c("#F9FAFB"), // gray-50
    });
  }

  function drawTitle(text, size = 18) {
    page.drawText(text, {
      x: layout.left + sectionPad,
      y: y - size,
      size,
      font: fonts.bold,
      color: c("#111827"),
    });
    y -= size + 10;
  }

  function drawParagraph(text, fontSize = 12, maxW) {
    const width = maxW ?? (layout.right - layout.left - sectionPad * 2);
    const lines = wrapText(text, fonts.regular, fontSize, width);

    for (const line of lines) {
      // blank line -> extra space
      if (line.trim() === "") {
        y -= 10;
        continue;
      }

      if (y - fontSize < contentMinY) return false;

      page.drawText(line, {
        x: layout.left + sectionPad,
        y: y - fontSize,
        size: fontSize,
        font: fonts.regular,
        color: c("#111827"),
      });
      y -= 16; // line height
    }
    return true;
  }

  function renderSection(title, body) {
    // Estimate height by rough line count (good enough for layout)
    const titleH = 28;
    const bodyLines = wrapText(body, fonts.regular, 12, layout.right - layout.left - sectionPad * 2);
    const bodyH = bodyLines.length * 16 + 12;

    const boxH = titleH + bodyH + sectionPad;

    // If section would collide with footer, just stop (or you can add a 3rd page)
    if (y - boxH < contentMinY) return false;

    // Box
    drawSectionBox(y, boxH);

    // Content
    y -= sectionPad;
    drawTitle(title, 18);
    drawParagraph(body, 12);

    // Bottom gap after section
    y -= sectionGap;
    return true;
  }

  // --- SECTION 1 ---
  renderSection(
    "Strategic Analysis",
    "This assessment evaluates your business across the seven strategic pillars of Chanakya’s Saptang, each of which directly influences long-term business valuation.\n\nYour scores indicate that while leadership vision, market opportunity, and financial discipline are strong, certain structural pillars need strengthening to fully support scalable growth and higher valuation multiples."
  );

  // --- SECTION 2 ---
  renderSection(
    "Valuation Enhancement Analysis",
    "Your vision and market opportunity are strong, but management and systems need strengthening to unlock higher valuation.\nMarket demand exists, yet process digitization and delegation are required to scale efficiently.\nFinancial readiness is present, but advisory support will significantly enhance investor confidence."
  );

  // --- ACTIONS (better bullets + wrap + indentation) ---
  const actionsTitle = "Priority Value Enhancement Actions";
  const actions = [
    "Value Enhancement Roadmap (Next Phase)",
    "Recommended Next Step",
  ];

  // Actions box sizing
  const actionTitleH = 28;
  const bulletFontSize = 12;
  const bulletIndent = 22;
  const bulletMaxW = (layout.right - layout.left) - sectionPad * 2 - bulletIndent;

  // calculate bullets height with wrap
  let bulletsLineCount = 0;
  for (const t of actions) {
    bulletsLineCount += wrapText(t, fonts.semibold, bulletFontSize, bulletMaxW).length;
  }
  const bulletsH = bulletsLineCount * 16 + 10;
  const actionsBoxH = actionTitleH + bulletsH + 18;

  if (y - actionsBoxH > contentMinY) {
    drawSectionBox(y, actionsBoxH);

    y -= sectionPad;
    drawTitle(actionsTitle, 18);

    for (const t of actions) {
      const lines = wrapText(t, fonts.semibold, bulletFontSize, bulletMaxW);

      // bullet dot aligned with first line
      const dotX = layout.left + sectionPad + 6;
      const firstLineY = y - bulletFontSize + 4;

      page.drawCircle({ x: dotX, y: firstLineY, size: 3.5, color: c("#22c55e") });

      for (const [i, line] of lines.entries()) {
        if (y - bulletFontSize < contentMinY) break;

        page.drawText(line, {
          x: layout.left + sectionPad + bulletIndent,
          y: y - bulletFontSize,
          size: bulletFontSize,
          font: fonts.semibold,
          color: c("#111827"),
        });
        y -= 16;
      }
      y -= 4;
    }

    y -= sectionGap;
  }

  // --- CLOSING THOUGHT ---
  const closingTitle = "Closing Thought";
  const closingBody =
    "Valuation is not just about today’s profit — it’s about building a business that can scale beyond the founder, run on systems, and earn investor-grade confidence.";

  // Closing box
  const closingLines = wrapText(closingBody, fonts.regular, 12, layout.right - layout.left - sectionPad * 2);
  const closingBoxH = 28 + closingLines.length * 16 + 18;

  if (y - closingBoxH > contentMinY) {
    drawSectionBox(y, closingBoxH);

    y -= sectionPad;
    drawTitle(closingTitle, 18);
    drawParagraph(closingBody, 12);

    y -= 10;
  }

  // Footer last
  drawFooter(page, fonts);
}

/**
 * Frontend-only generator:
 * submission: { form, answers, totalScore, VRI, category, interpretation }
 * opts: { logoUrl, fonts: {regular,medium,semibold,bold} }
 */
export async function generateValuationPdfBlob(submission, opts = {}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Fonts from public/fonts
  const [regB, medB, semB, boldB] = await Promise.all([
    fetchBytes(opts.fonts?.regular || "/fonts/Poppins-Regular.ttf"),
    fetchBytes(opts.fonts?.medium || "/fonts/Poppins-Medium.ttf"),
    fetchBytes(opts.fonts?.semibold || "/fonts/Poppins-SemiBold.ttf"),
    fetchBytes(opts.fonts?.bold || "/fonts/Poppins-Bold.ttf"),
  ]);

  const fonts = {
    regular: await pdfDoc.embedFont(regB),
    medium: await pdfDoc.embedFont(medB),
    semibold: await pdfDoc.embedFont(semB),
    bold: await pdfDoc.embedFont(boldB),
  };

  // Logo (use imported asset URL from React)
  let logoImage = null;
  try {
    if (opts.logoUrl) {
      const logoBytes = await fetchBytes(opts.logoUrl);
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
    }
  } catch {
    logoImage = null;
  }

  const p1 = pdfDoc.addPage([A4.w, A4.h]);
  renderPage1(p1, submission, fonts, { logoImage });

  const p2 = pdfDoc.addPage([A4.w, A4.h]);
  renderPage2(p2, fonts, { logoImage });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return { blob, url };
}
