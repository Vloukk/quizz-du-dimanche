// utils/db.js
import { MongoClient } from "mongodb";

let client;
let db;

const connectToDatabase = async () => {
  if (db) {
    // Si déjà connecté, retourne la connexion existante
    return { db, client };
  }

  try {
    console.log("Tentative de connexion à MongoDB...");
    client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db("quiz"); // Choix de la base de données
    console.log("Connexion MongoDB réussie.");
    return { db, client };
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    throw new Error("Erreur de connexion à MongoDB");
  }
};

export { connectToDatabase };
