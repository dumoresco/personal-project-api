"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserService_1 = require("../services/UserService");
const router = (0, express_1.Router)();
const userController = new UserService_1.UserService();
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/login-otp", userController.loginOtp);
// reset password
router.post("/:userId/reset-password", userController.resetPassword);
exports.default = router;
