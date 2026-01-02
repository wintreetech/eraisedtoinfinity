const nodemailer = require("nodemailer");

const sendEmail = async (email, filepath) => {
	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "youremail@gmail.com",
			pass: "your-app-password",
		},
	});

	await transporter.sendMail({
		from: "Your Company <youremail@gmail.com>",
		to: email,
		subject: "Your Valuation Readiness Report",
		text: "Attached is your personalized valuation assessment report.",
		attachments: [
			{
				filename: "report.pdf",
				path: filepath,
			},
		],
	});
};

module.exports = sendEmail;
