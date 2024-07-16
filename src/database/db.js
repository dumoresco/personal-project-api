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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
require("dotenv").config();
const mongodb_1 = require("mongodb");
const url = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@finances.w43q48h.mongodb.net/?retryWrites=true&w=majority`;
const DB_NAME = process.env.MONGO_DB_NAME;
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = new mongodb_1.MongoClient(url, {
                useUnifiedTopology: true,
            });
            yield client.connect();
            console.log("Conexão com o MongoDB estabelecida com sucesso");
            return client.db(DB_NAME);
        }
        catch (error) {
            console.error("Erro ao conectar ao MongoDB", error);
            throw error;
        }
    });
}
exports.connectToDatabase = connectToDatabase;
