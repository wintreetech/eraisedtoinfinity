import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { questions } from "../utils/questions";
import logo from "../assets/einfinity-logo-final.png"; 
import { calculateVRIFromAnswers } from "../utils/calculateScore";
import { generateValuationPdfBlob } from "../utils/generatePdfFront";
import { openPdfInNewTab } from "../utils/openPdf";



const LS = {
	STEP: "vr_step",
	QIDX: "vr_qidx",
	FORM: "vr_form",
	ANSWERS: "vr_answers",
	COMPLETED: "vr_completed",
};

const defaultForm = {
	firstName: "",
	lastName: "",
	contact: "",
	email: "",
	companyName: "",
	designation: "",
	city: "",
	businessType: "",
	teamSize: "",
	isFounder: "",
	founderName: "",
	founderEmail: "",
	founderContact: "",
};

export default function AssessmentForm() {
  const [emailLoading, setEmailLoading] = useState(false);
const [downloadLoading, setDownloadLoading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState(Number(localStorage.getItem(LS.STEP)) || 1);
	const [qIdx, setQIdx] = useState(Number(localStorage.getItem(LS.QIDX)) || 0);
	const [form, setForm] = useState(
		JSON.parse(localStorage.getItem(LS.FORM)) || defaultForm
	);

	const [pdfUrl, setPdfUrl] = useState(localStorage.getItem("vr_pdf_url") || "");
const [sending, setSending] = useState(false);
	const [answersArr, setAnswersArr] = useState(
		JSON.parse(localStorage.getItem(LS.ANSWERS)) || []
	); // array of answers objects
	const [completed, setCompleted] = useState(
		Boolean(localStorage.getItem(LS.COMPLETED))
	);

	useEffect(() => localStorage.setItem(LS.STEP, String(step)), [step]);
	useEffect(() => localStorage.setItem(LS.QIDX, String(qIdx)), [qIdx]);
	useEffect(() => localStorage.setItem(LS.FORM, JSON.stringify(form)), [form]);
	useEffect(
		() => localStorage.setItem(LS.ANSWERS, JSON.stringify(answersArr)),
		[answersArr]
	);
	useEffect(
		() => localStorage.setItem(LS.COMPLETED, JSON.stringify(completed)),
		[completed]
	);

	const totalQuestions = questions.length;

	const totalScore = useMemo(
		() => answersArr.reduce((s, a) => s + Number(a.score || 0), 0),
		[answersArr]
	);

	const maxScore = useMemo(() => {
  return questions.reduce((sum, q) => {
    if (q.type === "single_choice") {
      return sum + Math.max(...q.options.map(o => Number(o.value)));
    }
    if (q.type === "scale") {
      return sum + (q.scale?.max ?? 5);
    }
    if (q.type === "numeric_bucket") {
      return sum + Math.max(...(q.scoringLogic || []).map(r => Number(r.value)));
    }
    return sum;
  }, 0);
}, []);
	const VRI = useMemo(
  () => Number(((totalScore / maxScore) * 100).toFixed(2)),
  [totalScore, maxScore]
);

	useEffect(() => {
		if (step === 2 && qIdx >= totalQuestions) {
			setStep(3);
		}
	}, [step, qIdx, totalQuestions]);

	const updateForm = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const startAssessment = () => {
		// validate required fields
		const required = [
			"firstName",
			"lastName",
			"email",
			"contact",
			"companyName",
			"designation",
			"city",
			"businessType",
			"teamSize",
			"isFounder",
		];
		if (form.isFounder === "No")
			required.push("founderName", "founderEmail", "founderContact");
		for (let k of required) {
			if (!form[k] || String(form[k]).trim() === "") {
				alert("Please fill all required fields.");
				return;
			}
		}
		setStep(2);
		setQIdx(0);
	};

	const setAnswer = (score, selectedLabel, rawValue = null) => {
  const q = questions[qIdx];

  setAnswersArr((prev) => {
    const copy = [...prev];
    const existingIndex = copy.findIndex((a) => a.questionId === q.id);

    const answerObj = {
      questionId: q.id,
      questionText: q.label,
      selectedLabel: selectedLabel ?? "",
      score: Number(score) || 0,
      rawValue, // useful for numeric_bucket (Q3, Q8)
      pillar: q.pillar,
      type: q.type,
    };

    if (existingIndex >= 0) copy[existingIndex] = answerObj;
    else copy.push(answerObj);

    return copy;
  });
};

	// const next = () => {
	// 	// ensure current question answered
	// 	const q = questions[qIdx];
	// 	const existing = answersArr.find((a) => a.questionId === q.id);
	// 	if (!existing) {
	// 		alert("Please answer before proceeding.");
	// 		return;
	// 	}
	// 	if (qIdx < totalQuestions - 1) setQIdx(qIdx + 1);
	// 	else {
	// 		setStep(3);
	// 		setCompleted(true);
	// 	}
	// };

	const next = () => {
  const q = questions[qIdx];
  const ans = answersArr.find((a) => a.questionId === q.id);

  // must exist
  if (!ans) {
    alert("Please answer before proceeding.");
    return;
  }

  // numeric_bucket must have rawValue
  if (q.type === "numeric_bucket") {
  const rv = ans?.rawValue;
  if (rv === null || rv === undefined || String(rv).trim() === "") {
    alert("Please enter a number before proceeding.");
    return;
  }
}

  if (qIdx < totalQuestions - 1) setQIdx(qIdx + 1);
  else {
    setCompleted(true);
    setStep(3);
  }
};


const submitToBackendAndEmail = async () => {
  if (isLive) {
    alert("Email sending will be enabled once the project is fully live.");
    return;
  }

  try {
    setEmailLoading(true);
    await generateReport({ action: "email" });
    alert("Report emailed successfully!");
  } catch (err) {
    console.error("Submit Error:", err);
    alert(err.message || "Something went wrong while submitting.");
  } finally {
    setEmailLoading(false);
  }
};
	const answeredCount = answersArr.length;
	const reportRows = questions.map((q, i) => {
		const a = answersArr.find((x) => x.questionId === q.id);
		return {
			index: i + 1,
			question: q.label,
			selected: a?.selectedLabel || "—",
			score: a?.score || 0,
		};
	});

	const resetAssessment = () => {
		// Clear all localStorage related to this assessment
		localStorage.removeItem(LS.STEP);
		localStorage.removeItem(LS.QIDX);
		localStorage.removeItem(LS.FORM);
		localStorage.removeItem(LS.ANSWERS);
		localStorage.removeItem(LS.COMPLETED);
		localStorage.removeItem("valuation_result"); // if you stored result

		// Reset state
		setStep(1);
		setQIdx(0);
		setForm(defaultForm);
		setAnswersArr([]);
		setCompleted(false);
	};

	const back = () => {
  if (step === 2 && qIdx > 0) setQIdx(qIdx - 1);
  else if (step === 2 && qIdx === 0) setStep(1);
  else if (step === 3) {
    setStep(2);
    setQIdx(totalQuestions - 1);
  }
};

const isLive = useMemo(() => {
  const host = window.location.hostname || "";
  return host.includes("onrender.com") || host.includes("render.com");
}, []);

// ✅ One function to generate PDF (and optionally email)
const generateReport = async ({ action }) => {
  // action: "email" | "download"
  const stage =
    VRI <= 40
      ? "Foundation Stage"
      : VRI <= 60
      ? "Structured Stage"
      : VRI <= 80
      ? "Scalable Stage"
      : "Valuation Ready";

  // Auto-save locally
  localStorage.setItem(
    "valuation_result",
    JSON.stringify({
      form,
      answersArr,
      totalScore,
      VRI,
      stage,
      time: new Date().toISOString(),
    })
  );

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const apiUrl = (isLocalhost
    ? import.meta.env.VITE_LOCAL_URL
    : import.meta.env.VITE_PROD_URL
  )?.replace(/\/$/, ""); // remove trailing slash

  const backendRes = await fetch(`${apiUrl}/api/form/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form,
      answers: answersArr,
      action, // ✅ tell backend what to do
      meta: { totalScore, VRI, stage }, // optional but useful
    }),
  });

  const data = await backendRes.json();
  if (!backendRes.ok) throw new Error(data.message || "Backend error");

  // expected: { pdfUrl: "..." }
  if (data.pdfUrl) {
    setPdfUrl(data.pdfUrl);
    localStorage.setItem("vr_pdf_url", data.pdfUrl);
  }

  return data;
};



	return (
		<div className="min-h-screen p-6 flex justify-center bg-white text-gray-900">
  <div className="w-full max-w-4xl bg-white border border-gray-200 shadow-xl rounded-2xl p-8">
				<div className="flex justify-between items-center mb-6">
				{step !== 3 && (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold">Valuation Readiness Assessment</h1>
  </div>
)}

					
				</div>

				{/* Step 1 */}
				{step === 1 && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<input
								name="firstName"
								placeholder="First Name *"
								value={form.firstName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<input
								name="lastName"
								placeholder="Last Name *"
								value={form.lastName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<input
								name="email"
								type="email"
								placeholder="Email *"
								value={form.email}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="contact"
								placeholder="Contact *"
								value={form.contact}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="companyName"
								placeholder="Company Name *"
								value={form.companyName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="designation"
								placeholder="Designation *"
								value={form.designation}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="city"
								placeholder="City *"
								value={form.city}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<select
								name="businessType"
								value={form.businessType}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							>
								<option value="">Business Type *</option>
								<option value="Proprietary">Proprietary</option>
								<option value="Partnership">Partnership</option>
								<option value="LLP">LLP</option>
								<option value="Private Limited">Private Limited</option>
							</select>
							<select
								name="teamSize"
								value={form.teamSize}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							>
								<option value="">Team Size *</option>
								<option value="1-10">1–10</option>
								<option value="11-30">11–30</option>
								<option value="31-75">31–75</option>
								<option value="76-150">76–150</option>
								<option value="150+">150+</option>
							</select>
							<select
								name="isFounder"
								value={form.isFounder}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							>
								<option value="">Are you a Founder? *</option>
								<option value="Yes">Yes</option>
								<option value="No">No</option>
							</select>
						</div>

						{form.isFounder === "No" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
								<input
									name="founderName"
									placeholder="Founder Name *"
									value={form.founderName}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
								/>
								<input
									name="founderEmail"
									placeholder="Founder Email *"
									value={form.founderEmail}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
								/>
								<input
									name="founderContact"
									placeholder="Founder Contact *"
									value={form.founderContact}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
								/>
							</div>
						)}

						<div className="flex justify-end mt-6">
							<button
								className="btn btn-primary px-6 py-2 rounded-lg shadow"
								onClick={startAssessment}
							>
								Begin Assessment →
							</button>
						</div>
					</div>
				)}

				{/* Step 2: one question per page */}
				{step === 2 && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-[14px] font-medium">
          Question {qIdx + 1} of {totalQuestions}
        </h3>
        <p className="text-lg font-semibold text-gray-700 mt-1">
          {questions[qIdx].label}
        </p>
      </div>
    </div>

    <div className="card p-6 mb-4 border shadow-md bg-base-100 rounded-lg">
      {(() => {
        const q = questions[qIdx];
        const existing = answersArr.find((a) => a.questionId === q.id);

        // helper: for numeric_bucket scoring
        const scoreFromNumeric = (num) => {
          const rules = q.scoringLogic || [];
          for (const r of rules) {
            const [min, max] = r.range;
            if (num >= min && num <= max) return r.value;
          }
          return 0;
        };

        // ✅ 1) single_choice
        if (q.type === "single_choice") {
          return q.options.map((opt) => {
            const checked = existing
              ? Number(existing.score) === Number(opt.value)
              : false;

            return (
              <label
                key={opt.label}
                className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-base-200 transition"
              >
                <input
                  type="radio"
                  className="radio radio-primary"
                  checked={checked}
                  onChange={() => setAnswer(opt.value, opt.label)}
                />
                <span className="text-gray-800">{opt.label}</span>
              </label>
            );
          });
        }

        // ✅ 2) scale (1–5)
        if (q.type === "scale") {
          const min = q.scale?.min ?? 1;
          const max = q.scale?.max ?? 5;
          const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

          return (
            <div className="space-y-2">
              <div className="flex justify-between text-xs opacity-70 mb-2">
                <span>{q.scale?.labels?.[min] ?? "Low"}</span>
                <span>{q.scale?.labels?.[max] ?? "High"}</span>
              </div>

              {values.map((v) => {
                const checked = existing ? Number(existing.score) === Number(v) : false;
                return (
                  <label
                    key={v}
                    className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-base-200 transition"
                  >
                    <input
                      type="radio"
                      className="radio radio-primary"
                      checked={checked}
                      onChange={() => setAnswer(v, String(v))}
                    />
                    <span className="text-gray-800">{v}</span>
                  </label>
                );
              })}
            </div>
          );
        }

        // ✅ 3) numeric_bucket (Q3, Q8)
        if (q.type === "numeric_bucket") {
          return (
            <div className="space-y-3">
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="Enter a number"
                defaultValue={existing?.rawValue ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const num = Number(raw);
                if (!raw) return setAnswer(0, "—", raw);
                  const score = scoreFromNumeric(num);
                  setAnswer(score, String(num), raw);
                }}
              />

              <div className="text-xs opacity-70">
                Your input will be scored automatically based on defined ranges.
              </div>
            </div>
          );
        }

        return <div className="text-sm opacity-70">Unsupported question type.</div>;
      })()}
    </div>

    <div className="flex justify-between">
      <button className="btn btn-outline" onClick={back}>
        Back
      </button>
      <button className="btn btn-primary" onClick={next}>
        Next →
      </button>
    </div>
  </div>
)}

				{/* Step 3: report */}
				{step === 3 && (() => {
  const assessmentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const getStageMeta = (vri) => {
    if (vri <= 40) return {
      emoji: "🔴",
      stage: "ANVESHAK STAGE — The Explorer",
      modern: "Foundation Stage",
      badgeClass: "badge-error",
      scoreBg: "bg-red-50",
      border: "border-red-200",
      meaning:
        "Your business is in the foundation phase. Focus on clarifying direction, strengthening systems, and building early structure to unlock valuation growth."
    };
    if (vri <= 60) return {
      emoji: "🟠",
      stage: "PRABANDHAK STAGE — The Organizer",
      modern: "Structured Stage",
      badgeClass: "badge-warning",
      scoreBg: "bg-orange-50",
      border: "border-orange-200",
      meaning:
        "Your business has basic structure in place. Strengthen management depth, governance, and repeatable execution to move toward scalable value creation."
    };
    if (vri <= 80) return {
      emoji: "🟢",
      stage: "VIKASHAK STAGE — The Scaler",
      modern: "Scalable Stage",
      badgeClass: "badge-success",
      scoreBg: "bg-green-50",
      border: "border-green-200",
      meaning:
        "Your business has strong growth potential and market strength. With focused improvements in systems, management depth, and advisory support, the enterprise can unlock significantly higher valuation."
    };
    return {
      emoji: "🟢🟢",
      stage: "VIJIGISHU STAGE — The Conqueror",
      modern: "Valuation Ready",
      badgeClass: "badge-success",
      scoreBg: "bg-emerald-50",
      border: "border-emerald-200",
      meaning:
        "Your business shows high strategic maturity and valuation readiness. The next phase is expansion, stronger alliances, and institutional governance for long-term enterprise wealth."
    };
  };

  const meta = getStageMeta(VRI);

//   const handleDownloadPdf = async () => {
//   try {
//     setDownloadLoading(true);

//     const data = await generateReport({ action: "download" });
//     if (!data.pdfUrl) {
//       alert("PDF link not received from backend.");
//       return;
//     }

//     window.open(`${data.pdfUrl}?v=${Date.now()}`, "_blank", "noopener,noreferrer");
//   } catch (err) {
//     console.error("Download Error:", err);
//     alert(err.message || "Something went wrong while downloading.");
//   } finally {
//     setDownloadLoading(false);
//   }
// };

const handleDownloadPdf = async () => {
  try {
    setDownloadLoading(true);

    const assessmentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const submission = {
      form: { ...form, assessmentDate },
      answers: answersArr,
      totalScore,
      VRI,
      category:
        VRI <= 40 ? "Foundation Stage" : VRI <= 60 ? "Structured Stage" : VRI <= 80 ? "Scalable Stage" : "Valuation Ready",
      interpretation: "", // optional
    };

    const { url } = await generateValuationPdfBlob(submission, {
      logoUrl: logo, // your imported logo from assets
    });

    openPdfInNewTab(url);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    console.error("PDF Error:", err);
    alert(err?.message || "Failed to generate PDF");
  } finally {
    setDownloadLoading(false);
  }
};


  return (
    <div className="max-w-4xl mx-auto">
  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-10">
    {/* Header */}
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <img
          src={logo}
          alt="E Raised To Infinity"
          className="h-10 sm:h-12 w-auto object-contain"
        />
        <div className="leading-tight">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Valuation Readiness Report
          </h2>
          <p className="text-sm text-gray-500">by E Raised To Infinity</p>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">
          Assessment Date
        </div>
        <div className="text-sm font-semibold text-gray-900">{assessmentDate}</div>
      </div>
    </div>

    <div className="my-6 border-t border-gray-200" />

    {/* Meta cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">Company</div>
        <div className="mt-1 text-base font-semibold text-gray-900">
          {form.companyName || "—"}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">
          Industry / Sector
        </div>
        <div className="mt-1 text-base font-semibold text-gray-900">
          {form.businessType || "—"}
        </div>
      </div>
    </div>

    {/* Intro */}
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm leading-relaxed text-gray-700">
        This report is generated based on responses provided through the Value Enhancement
        Assessment, designed to evaluate strategic maturity and value creation potential.
      </p>
    </div>

    <div className="my-8 border-t border-gray-200" />

    {/* Score + Stage */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-[11px] uppercase tracking-wide font-bold text-black">
          Valuation Assessment Overall Score
        </div>
        <div className="mt-3 flex items-end gap-2">
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900">
            {VRI}
          </div>
          <div className="text-lg font-semibold text-gray-500 mb-1">%</div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Higher score indicates stronger valuation readiness.
        </div>
      </div>

      <div className={`rounded-2xl border ${meta.border} ${meta.scoreBg} p-6`}>
        <div className="text-[11px] uppercase tracking-wide font-bold text-black">
          Chanakya Stage
        </div>
        <div className="mt-3 text-lg font-extrabold text-gray-900">
          {meta.emoji} {meta.stage}
        </div>
        <div className="mt-3">
          <span className={`badge ${meta.badgeClass}`}>{meta.modern}</span>
        </div>
      </div>
    </div>

    {/* Meaning */}
    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <div className="text-[11px] uppercase tracking-wide font-bold text-black">
        What it means
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{meta.meaning}</p>
    </div>

    {/* Actions */}
    <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
  className="btn btn-primary rounded-xl px-6"
  onClick={submitToBackendAndEmail}
  disabled={emailLoading}
>
  {emailLoading ? (
    <>
      <span className="loading loading-spinner mr-2"></span>
      Sending...
    </>
  ) : (
    "Email Report"
  )}
</button>

        <button
  className="btn btn-outline btn-primary rounded-xl px-6"
  onClick={handleDownloadPdf}
  disabled={downloadLoading}
>
  {downloadLoading ? (
    <>
      <span className="loading loading-spinner mr-2"></span>
      Generating...
    </>
  ) : (
    "Download PDF"
  )}
</button>
      </div>

      <button className="btn rounded-xl px-6" onClick={resetAssessment}>
        Retake Assessment
      </button>
    </div>

    {/* Footer single line */}
    {/* <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
      <span className="font-semibold text-gray-900">Mr. Kamlesh B</span>
      <span className="mx-2 text-gray-300">|</span>
      <a className="underline" href="mailto:kamlesh@eraisedtoinfinity.com">
        kamlesh@eraisedtoinfinity.com
      </a>
      <span className="mx-2 text-gray-300">|</span>
      <a className="underline" href="tel:+919619415535">
        +91 96194 15535
      </a>
    </div> */}
  </div>
</div>
  );
})()}
			</div>
		</div>
	);
}
