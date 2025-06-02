const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const auth = require("../../middlewares/auth");
const {
  validateRegistration,
  validateLogin,
  validateSubscription,
} = require("../../middlewares/validation");
require("dotenv").config();
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");
const Jimp = require("jimp");

const { SECRET_KEY = "secret-key" } = process.env;

// Configurare multer pentru upload în folderul tmp
const tempDir = path.join(__dirname, "../../tmp");
const avatarsDir = path.join(__dirname, "../../public/avatars");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // denumire unică: userId_originalname
    cb(null, `${req.user._id}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// /users/signup
router.post("/signup", validateRegistration, async (req, res, next) => {
  try {
    const { email, password, subscription = "starter" } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Gravatar URL
    // Use the gravatar package to generate a URL based on the user's email
    const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      subscription,
      avatarURL,
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

// /users/login
router.post("/login", validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const payload = {
      id: user._id,
    };

    console.log("SECRET_KEY:", SECRET_KEY);
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

// /users/logout
router.get("/logout", auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { token: null });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// /users/current
router.get("/current", auth, async (req, res, next) => {
  try {
    const { email, subscription } = req.user;

    res.status(200).json({
      email,
      subscription,
    });
  } catch (error) {
    next(error);
  }
});

// Update subscription - /users
router.patch("/", auth, validateSubscription, async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const { _id } = req.user;

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true }
    );

    res.status(200).json({
      email: updatedUser.email,
      subscription: updatedUser.subscription,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/avatars
router.patch(
  "/avatars",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { path: tempUpload, filename } = req.file;
      console.log("Temp upload path:", tempUpload, filename);
      console.log(req.file);

      const resultUpload = path.join(avatarsDir, filename);

      // Procesează imaginea cu Jimp (redimensionare 250x250)
      // console.log("Jimp:", Jimp);
      try {
        const image = await Jimp.read(tempUpload);
        await image.resize(250, 250).writeAsync(tempUpload);
      } catch (err) {
        console.error("Eroare Jimp:", err);
        return res
          .status(500)
          .json({ message: "Eroare la procesarea imaginii cu Jimp" });
      }

      // Mută fișierul din tmp în public/avatars
      await fs.rename(tempUpload, resultUpload);

      // Creează calea publică pentru avatar
      const avatarURL = `/avatars/${filename}`;

      // Actualizează avatarul în baza de date
      await User.findByIdAndUpdate(req.user._id, { avatarURL });

      res.status(200).json({ avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
