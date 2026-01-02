import mongoose from "mongoose";

const connectDB = async () => {
	try {
		const uri = process.env.MONGODB_URI;
		if (!uri) throw new Error("MONGODB_URI missing");
		await mongoose.connect(uri);
		console.log("MongoDB connected");
	} catch (err) {
		console.error("DB connect error:", err.message);
		process.exit(1);
	}
};

export default connectDB;
