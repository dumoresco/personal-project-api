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
exports.UserService = void 0;
const db_1 = require("../database/db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv").config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
class UserService {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, password, username } = req.body;
                if (!name || !email || !password) {
                    return res
                        .status(400)
                        .json({ message: "Nome, email e senha são obrigatórios" });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const existingUser = yield usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "Email já cadastrado" });
                }
                // Cria um PIN de 6 digitos para o usuário
                const generetePinSixDigits = () => {
                    return Math.floor(100000 + Math.random() * 900000);
                };
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const newUser = {
                    id: (0, crypto_1.randomUUID)(),
                    name,
                    username,
                    pin: generetePinSixDigits(),
                    email,
                    password: hashedPassword,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const result = yield usersCollection.insertOne(newUser);
                newUser.id = result.insertedId.toHexString();
                res.status(201).json({ message: "Usuário registrado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ email });
                if (!user) {
                    return res.status(401).json({ error: "E-mail ou senha incorretos" });
                }
                const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: "E-mail ou senha incorretos" });
                }
                const jwtSecret = process.env.JWT_SECRET;
                // cria um OTP de 6 digitos para o usuário
                const token = jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, {
                    expiresIn: "1d",
                });
                res.status(200).json({
                    msg: "Login realizado com sucesso",
                    token,
                    user,
                });
            }
            catch (error) {
                console.error("Erro ao fazer login:", error);
                res.status(500).json({ error: "Erro interno no servidor" });
            }
        });
    }
    loginOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { pin } = req.body;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ pin });
                if (!user) {
                    return res.status(401).json({ error: " PIN incorreto" });
                }
                const jwtSecret = process.env.JWT_SECRET;
                // cria um OTP de 6 digitos para o usuário
                const token = jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, {
                    expiresIn: "1d",
                });
                res.status(200).json({
                    msg: "Login realizado com sucesso",
                    token,
                    user,
                });
            }
            catch (error) {
                console.error("Erro ao fazer login:", error);
                res.status(500).json({ error: "Erro interno no servidor" });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { oldPassword, newPassword } = req.body;
                const { userId } = req.params;
                // Verificar se oldPassword e newPassword são fornecidos
                if (!oldPassword || !newPassword) {
                    return res.status(400).json({
                        message: "É necessário fornecer a senha antiga e a nova senha",
                    });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                // Verificar se o usuário existe
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                // Verificar se a senha antiga está correta
                const isValidPassword = yield bcrypt_1.default.compare(oldPassword, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ message: "Senha antiga incorreta" });
                }
                // Hash da nova senha
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                // Atualizar a senha do usuário
                yield usersCollection.updateOne({ id: userId }, 
                // updateAt é a data atual
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date().toISOString(),
                    },
                });
                // retorna obj data com o usuario atualizado
                res.status(200).json({ message: "Senha resetada com sucesso", user });
            }
            catch (error) {
                console.log("Erro ao resetar a senha", error);
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
}
exports.UserService = UserService;
