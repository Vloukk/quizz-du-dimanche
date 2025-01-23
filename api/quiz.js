import { MongoClient } from "mongodb";

// Remplace cette URL par ta propre URI MongoDB avec ton mot de passe
const MONGODB_URI = process.env.MONGODB_URI;  // Assure-toi que MONGODB_URI est défini dans ton fichier .env
const DATABASE_NAME = "quiz"; // Nom de ta base de données

let client;
let db;

const connectToDatabase = async () => {
  if (db) {
    // Si déjà connecté, on retourne la connexion existante
    console.log("MongoDB déjà connecté.");
    return { db, client };
  }

  try {
    console.log("Tentative de connexion à MongoDB...");
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db(DATABASE_NAME);
    console.log("Connexion MongoDB réussie.");
    return { db, client };
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    throw new Error("Erreur de connexion à MongoDB");
  }
};

export default async function handler(req, res) {
  // Vérifie que la méthode HTTP est GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Connecte à la base de données MongoDB
  let dbConnection;
  try {
    dbConnection = await connectToDatabase();
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }

  const { db } = dbConnection;

  try {
    // Récupère les questions depuis la collection "questions" de MongoDB
    console.log("Récupération des questions...");
    const questions = await db.collection("questions").find().toArray();
    console.log("Questions récupérées:", questions);

    // Si pas de questions, retourne un message
    if (questions.length === 0) {
      return res.status(200).json({ message: "Aucune question disponible." });
    }

    // Retourne les questions récupérées
    return res.status(200).json(questions);
  } catch (error) {
    console.error("Erreur lors de la récupération des questions:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la récupération des questions." });
  } finally {
    // Ferme la connexion MongoDB
    if (dbConnection) {
      console.log("Fermeture de la connexion MongoDB.");
      dbConnection.client.close();
    }
  }
}
