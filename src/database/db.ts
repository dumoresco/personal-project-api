require("dotenv").config();
import { MongoClient, MongoClientOptions } from "mongodb";

const url = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@finances.w43q48h.mongodb.net/?retryWrites=true&w=majority`;
const DB_NAME = process.env.MONGO_DB_NAME;

export async function connectToDatabase() {
  try {
    const client = new MongoClient(url, <MongoClientOptions>{
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Conexão com o MongoDB estabelecida com sucesso");
    return client.db(DB_NAME);
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB", error);
    throw error;
  }
}
