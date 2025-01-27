import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId est requis' });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      const db = client.db('quiz');
      const playersCollection = db.collection('players');

      // Mettre à jour le champ lastActive
      const result = await playersCollection.updateOne(
        { sessionId },
        { $set: { lastActive: new Date() } }
      );

      client.close();

      if (result.matchedCount > 0) {
        return res.status(200).json({ success: true, message: 'Activité mise à jour' });
      } else {
        return res.status(404).json({ error: 'Aucun joueur trouvé avec le sessionId fourni' });
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
