import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { questions } from "../utils/questions";

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
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState(Number(localStorage.getItem(LS.STEP)) || 1);
	const [qIdx, setQIdx] = useState(Number(localStorage.getItem(LS.QIDX)) || 0);
	const [form, setForm] = useState(
		JSON.parse(localStorage.getItem(LS.FORM)) || defaultForm
	);
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
		try {
			setLoading(true);

			const stage =
				VRI <= 40
					? "Foundation Stage"
					: VRI <= 60
					? "Structured Stage"
					: VRI <= 80
					? "Scalable Stage"
					: "Valuation Ready";

			// ✅ Auto-save locally
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

			// -------------------------------------
			// 1️⃣ SEND DATA TO BACKEND
			// -------------------------------------
			const backendRes = await fetch("http://localhost:5000/api/form/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					form,
					answers: answersArr,
				}),
			});

			const data = await backendRes.json();

			if (!backendRes.ok) {
				throw new Error(data.message || "Backend error");
			}

			// BACKEND RETURNS:
			// data.pdfUrl = dynamic PDF link
			// console.log("PDF URL:", data.pdfUrl);

			// -------------------------------------
			// 2️⃣ SEND EMAIL WITH DYNAMIC PDF URL
			// -------------------------------------
			const templateParams = {
				to_name: `${form.firstName} ${form.lastName}`,
				client_email: form.email,

				company_name: form.companyName,
				founder_name:
					form.isFounder === "Yes" ? form.firstName : form.founderName,

				vri: VRI + "%",
				total_score: totalScore,
				stage,

				// 🚀 THE MOST IMPORTANT PART
				pdf_link: data.pdfUrl, // <--- Dynamic PDF URL from backend
			};

			await emailjs.send(
				"service_1t71y9r",
				"template_zxsuhue",
				templateParams,
				"krU3R-4YV1aa0mxp_"
			);

			alert(`Report emailed successfully! !`);
		} catch (err) {
			console.error("Submit Error:", err);
			alert("Something went wrong while submitting.");
		} finally {
			setLoading(false);
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



	return (
		<div className="min-h-screen bg-base-200 p-6 flex justify-center">
			<div className="w-full max-w-4xl bg-base-100 shadow-xl rounded-2xl p-8">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Valuation Readiness Assessment</h1>

					{step === 3 && (
						<div className="text-sm opacity-70">
							Answered {answeredCount}/{totalQuestions}
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
      scoreBg: "bg-red-100",
      meaning:
        "Your business is in the foundation phase. Focus on clarifying direction, strengthening systems, and building early structure to unlock valuation growth."
    };
    if (vri <= 60) return {
      emoji: "🟠",
      stage: "PRABANDHAK STAGE — The Organizer",
      modern: "Structured Stage",
      badgeClass: "badge-warning",
      scoreBg: "bg-orange-100",
      meaning:
        "Your business has basic structure in place. Strengthen management depth, governance, and repeatable execution to move toward scalable value creation."
    };
    if (vri <= 80) return {
      emoji: "🟢",
      stage: "VIKASHAK STAGE — The Scaler",
      modern: "Scalable Stage",
      badgeClass: "badge-info",
      scoreBg: "bg-green-100",
      meaning:
        "Your business has strong growth potential and market strength. With focused improvements in systems, management depth, and advisory support, the enterprise can unlock significantly higher valuation."
    };
    return {
      emoji: "🟢🟢",
      stage: "VIJIGISHU STAGE — The Conqueror",
      modern: "Valuation Ready",
      badgeClass: "badge-success",
      scoreBg: "bg-emerald-100",
      meaning:
        "Your business shows high strategic maturity and valuation readiness. The next phase is expansion, stronger alliances, and institutional governance for long-term enterprise wealth."
    };
  };

  const meta = getStageMeta(VRI);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border rounded-2xl shadow p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-black leading-none">∞</div>
            <div>
              <h2 className="text-3xl font-bold">Valuation Readiness Report</h2>
              <p className="text-sm opacity-70">by E Raised To Infinity</p>
            </div>
          </div>

          <div className="text-right text-sm">
            <div className="font-semibold">Assessment Date</div>
            <div className="opacity-80">{assessmentDate}</div>
          </div>
        </div>

        <div className="divider my-4" />

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="border rounded-xl p-4">
            <div className="opacity-70">Company</div>
            <div className="font-semibold">{form.companyName || "—"}</div>
          </div>
          <div className="border rounded-xl p-4">
            <div className="opacity-70">Industry / Sector</div>
            <div className="font-semibold">{form.businessType || "—"}</div>
          </div>
        </div>

        {/* Intro */}
        <div className="mt-4 border border-dashed rounded-xl p-4 text-sm leading-relaxed">
          This report is generated based on responses provided by the founder through
          the Value Enhancement Assessment, designed to evaluate strategic maturity
          and value creation potential.
        </div>

        <div className="divider my-6" />

        {/* Hero Score Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm opacity-70">Valuation Assessment Overall Score</div>
            <div className="text-4xl font-extrabold mt-1">{VRI}%</div>
          </div>

          <div className={`rounded-2xl px-5 py-4 ${meta.scoreBg} border`}>
            <div className="text-sm font-semibold">Chanakya Stage</div>
            <div className="text-lg font-bold mt-1">{meta.emoji} {meta.stage}</div>
            <span className={`badge mt-2 ${meta.badgeClass}`}>{meta.modern}</span>
          </div>
        </div>

        {/* Meaning */}
        <div className="mt-6 border rounded-2xl p-5">
          <div className="text-sm font-semibold mb-2">What it means</div>
          <p className="text-sm leading-relaxed opacity-90">{meta.meaning}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 mt-6">
          <button
            className="btn btn-outline flex-1"
            onClick={() => {
              setStep(2);
              setQIdx(0);
            }}
          >
            Review Answers
          </button>

          <button
            className="btn btn-primary flex-1"
            onClick={submitToBackendAndEmail}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2"></span>
                Sending...
              </>
            ) : (
              "Finish & Email Report"
            )}
          </button>

          <button className="btn btn-error flex-1" onClick={resetAssessment}>
            Reset Assessment
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs opacity-60">
          For more information: Contact us • Phone & email
        </div>
      </div>
    </div>
  );
})()}
			</div>
		</div>
	);
}
