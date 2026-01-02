import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
	{
		questionId: { type: String },
		questionText: { type: String },
		selectedLabel: { type: String },
		score: { type: Number },
	},
	{ _id: false }
);

const SubmissionSchema = new mongoose.Schema({
	form: { type: Object, required: true }, // company & founder form object
	answers: { type: [AnswerSchema], required: true }, // array of answers
	totalScore: Number,
	VRI: Number,
	category: String,
	interpretation: String,
	pdfPath: String,
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Submission", SubmissionSchema);
