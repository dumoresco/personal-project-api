"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailAlreadyExists = exports.validatePassword = exports.validateCreateUserFields = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const validateCreateUserFields = (payload) => {
    const { name, email, password } = payload;
    const errors = [];
    if (!name) {
        errors.push("O campo 'name' é obrigatório");
    }
    if (!email) {
        errors.push("O campo 'email' é obrigatório");
    }
    if (!password) {
        errors.push("O campo 'password' é obrigatório");
    }
    if (!email && !password && !name) {
        errors.push("Nenhum campo foi enviado");
    }
    throw new Error(errors.join(", "));
};
exports.validateCreateUserFields = validateCreateUserFields;
const validatePassword = (user, password) => __awaiter(void 0, void 0, void 0, function* () {
    const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
    if (!isValidPassword) {
        throw new Error("E-mail ou senha incorretos");
    }
});
exports.validatePassword = validatePassword;
const validateEmailAlreadyExists = (email, db) => __awaiter(void 0, void 0, void 0, function* () {
    const usersCollection = db.collection("users");
    const existingEmail = yield usersCollection.findOne({ email });
    if (existingEmail) {
        throw new Error("Email já cadastrado");
    }
});
exports.validateEmailAlreadyExists = validateEmailAlreadyExists;
