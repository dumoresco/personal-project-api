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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cardsRoutes_1 = __importDefault(require("./routes/cardsRoutes"));
const transactionsRoutes_1 = __importDefault(require("./routes/transactionsRoutes"));
const savingRoutes_1 = __importDefault(require("./routes/savingRoutes"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
app.get("/api/emissao/passivosoperacoes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log("req.query", req.s);
    const ativosQuery = (_b = (_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.ativos) === null || _b === void 0 ? void 0 : _b.reduce((acc, ativo, index) => {
        acc[`ativos[${index}]`] = ativo;
        return acc;
    }, {});
    console.log("ativosQuery", ativosQuery);
    try {
        const response = yield axios_1.default.get("https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/passivosoperacoes", {
            headers: {
                "Content-Type": "application/json",
                "Allow-Control-Allow-Origin": "*",
            },
            params: Object.assign(Object.assign({}, req.query), ativosQuery),
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
}));
app.get("/api/emissao/passivosoperacoes/detalhe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/passivosoperacoes/detalhe", {
            headers: {
                "Content-Type": "application/json",
                "Allow-Control-Allow-Origin": "*",
            },
            params: req.query,
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
}));
app.get("/api/emissao/precificacoes/detalhe/fluxofinanceiro/grafico", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/precificacoes/detalhe/fluxofinanceiro/grafico", {
            headers: {
                "Content-Type": "application/json",
                "Allow-Control-Allow-Origin": "*",
            },
            params: req.query,
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
}));
app.get("/api/cedoc/files", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/cedoc/files", {
            headers: {
                "Content-Type": "application/json",
                "Allow-Control-Allow-Origin": "*",
            },
            params: req.query,
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
}));
app.use((0, cors_1.default)());
app.use("/auth", userRoutes_1.default);
app.use(cardsRoutes_1.default);
app.use(transactionsRoutes_1.default);
app.use(savingRoutes_1.default);
const port = 8000;
app.listen(port, () => {
    console.log(`Servidor ouvindo na porta ${port}`);
});
