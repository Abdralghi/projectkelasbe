const express = require("express");
const router = express.Router();

const { AuthController } = require("../controllers");
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { Register, keeplogin, login } = AuthController;

router.post("/register", Register);
router.post("/login", login);
router.get("/keeplogin", verifyTokenAccess, keeplogin);

module.exports = router;
