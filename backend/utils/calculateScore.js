export function calculateVRIFromAnswers(answerArray) {
	// answerArray: [{ questionId, questionText, selectedLabel, score }]
	const totalScore = answerArray.reduce((s, a) => s + Number(a.score || 0), 0);
	const maxScore = 70; // 14 * 5
	const VRI = (totalScore / maxScore) * 100;

	let category = "";
	let interpretation = "";

	if (VRI <= 40) {
		category = "Foundation Stage";
		interpretation =
			"Business not valuation-ready. Needs fundamentals, systems, and structure.";
	} else if (VRI <= 60) {
		category = "Structured Stage";
		interpretation = "Needs systems, compliance, and team upgrades to scale.";
	} else if (VRI <= 80) {
		category = "Scalable Stage";
		interpretation =
			"High potential; consider capital and advisory to accelerate growth.";
	} else {
		category = "Valuation Ready";
		interpretation = "Strong fundamentals — ready for investors and expansion.";
	}

	return {
		totalScore,
		VRI: Number(VRI.toFixed(2)),
		category,
		interpretation,
	};
}
