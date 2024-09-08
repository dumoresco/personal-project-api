require("dotenv").config();
import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb";

const url = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@freecluster.klwjk.mongodb.net/?retryWrites=true&w=majority&appName=FreeCluster`;
const DB_NAME = process.env.MONGO_DB_NAME;

export async function connectToDatabase() {
  try {
    const client = new MongoClient(url, <MongoClientOptions>{
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Conexão com o MongoDB estabelecida com sucesso");
    return client.db(DB_NAME);
  } catch (error) {
    throw error;
  }
}
