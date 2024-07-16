"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
});
const UserModel = (0, mongoose_1.model)("User", userSchema);
exports.default = UserModel;
