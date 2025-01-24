import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { playerId, isReady } = req.body;
    const { gameId } = req.query; // Utilise le paramètre de la route

    if (!playerId || isReady === undefined || !gameId) {
      return res.status(400).json({ error: "Informations manquantes" });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      const db = client.db("quiz");
      const collection = db.collection("players");

      // Met à jour l'état de `isReady` pour ce joueur
      const result = await collection.updateOne(
        { _id: new ObjectId(playerId) },
        { $set: { isReady } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: "Mise à jour échouée" });
      }

      client.close();
    } catch (error) {
      console.error("Erreur serveur :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  } else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
