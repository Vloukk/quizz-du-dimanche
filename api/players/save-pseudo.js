// pages/api/save-pseudo.js
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { pseudo } = req.body;

    if (!pseudo) {
      return res.status(400).json({ error: 'Pseudo requis' });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      const db = client.db('quiz');
      const collection = db.collection('players');

      // Insère le pseudo avec le champ `isReady` initialisé à false
      const result = await collection.insertOne({ pseudo, isReady: false });

      // Répond avec l'ID généré
      res.status(201).json({ success: true, pseudoId: result.insertedId });

      client.close();
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

