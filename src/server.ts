import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import cardRoutes from "./routes/cardsRoutes";
import transactionRoutes from "./routes/transactionsRoutes";
import savingRoutes from "./routes/savingRoutes";
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.get("/api/emissao/passivosoperacoes", async (req: any, res: any) => {
  console.log("req.query", req.s);

  const ativosQuery = req?.query?.ativos?.reduce(
    (acc: any, ativo: string, index: number) => {
      acc[`ativos[${index}]`] = ativo;
      return acc;
    },
    {}
  );
  console.log("ativosQuery", ativosQuery);
  try {
    const response = await axios.get(
      "https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/passivosoperacoes",
      {
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
        params: {
          ...req.query,
          ...ativosQuery,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

app.get("/api/emissao/passivosoperacoes/detalhe", async (req, res) => {
  try {
    const response = await axios.get(
      "https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/passivosoperacoes/detalhe",
      {
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
        params: req.query,
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

app.get(
  "/api/emissao/precificacoes/detalhe/fluxofinanceiro/grafico",
  async (req, res) => {
    try {
      const response = await axios.get(
        "https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/emissao/precificacoes/detalhe/fluxofinanceiro/grafico",
        {
          headers: {
            "Content-Type": "application/json",
            "Allow-Control-Allow-Origin": "*",
          },
          params: req.query,
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      res.status(500).json({ error: "Erro ao buscar dados" });
    }
  }
);

app.get("/api/cedoc/files", async (req, res) => {
  try {
    const response = await axios.get(
      "https://portal-prod-api-portfolio-bff.azurewebsites.net/v1/api/cedoc/files",
      {
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
        params: req.query,
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

app.use(cors());
app.use("/auth", userRoutes);
app.use(cardRoutes);
app.use(transactionRoutes);
app.use(savingRoutes);

const port = 8000;
app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
