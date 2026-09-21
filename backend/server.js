const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const profileSchema = new mongoose.Schema({
  name: String,
  school: String,
  department: String,
  introduction: String,
  skills: [String],
  interests: [String],
  email: String
});
const Profile = mongoose.model("Profile", profileSchema);

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { username: username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login successful",
    token: token
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Portfolio Backend API is running!"
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token required"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({
        message: "Invalid or expired token"
      });
    }

    req.user = user;
    next();
  });
}

app.get("/api/profile", async (req, res) => {
  try {
    const profile = await Profile.findOne();

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const existingProfile = await Profile.findOne();

    if (existingProfile) {
      return res.status(400).json({
        message: "Profile already exists"
      });
    }

    const profile = new Profile({
      name: req.body.name,
      school: req.body.school,
      department: req.body.department,
      introduction: req.body.introduction,
      skills: req.body.skills,
      interests: req.body.interests,
      email: req.body.email
    });

    await profile.save();

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      {},
      {
        name: req.body.name,
        school: req.body.school,
        department: req.body.department,
        introduction: req.body.introduction,
        skills: req.body.skills,
        interests: req.body.interests,
        email: req.body.email
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
