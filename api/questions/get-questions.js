// pages/api/get-questions.js
import { connectToDatabase } from "../../utils/db"; // Importation de la fonction de connexion

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  let dbConnection;
  try {
    dbConnection = await connectToDatabase();
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }

  const { db } = dbConnection;

  try {
    const questions = await db.collection("questions").find().toArray();
    if (questions.length === 0) {
      return res.status(200).json({ message: "Aucune question disponible." });
    }
    return res.status(200).json(questions);
  } catch (error) {
    console.error("Erreur lors de la récupération des questions:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la récupération des questions." });
  }
}
