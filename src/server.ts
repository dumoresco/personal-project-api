import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import cardRoutes from "./routes/cardsRoutes";
import transactionRoutes from "./routes/transactionsRoutes";
import betRoutes from "./routes/betRoutes";
import savingRoutes from "./routes/savingRoutes";
import cors from "cors";

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

app.use(cors());
app.use(userRoutes);
app.use(cardRoutes);
app.use(transactionRoutes);
app.use(betRoutes);
app.use(savingRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
