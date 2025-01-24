import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { playerId, isReady } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'PlayerId requis' });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      const db = client.db('quiz');
      const playersCollection = db.collection('players');

      // Vérifier si playerId est valide
      if (!ObjectId.isValid(playerId)) {
        return res.status(400).json({ error: 'PlayerId invalide' });
      }

      // Mettre à jour l'état "isReady" du joueur
      const result = await playersCollection.updateOne(
        { _id: new ObjectId(playerId) },
        { $set: { isReady: isReady } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'Joueur non trouvé' });
      }

      client.close();

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
