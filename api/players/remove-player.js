import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
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

      // Vérifie si le joueur existe
      const existingPlayer = await playersCollection.findOne({ sessionId });

      if (!existingPlayer) {
        client.close();
        return res.status(404).json({ error: 'Aucun joueur trouvé avec le sessionId fourni' });
      }

      // Supprime le joueur
      const result = await playersCollection.deleteOne({ sessionId });

      client.close();

      if (result.deletedCount > 0) {
        return res.status(200).json({ success: true, message: 'Joueur supprimé avec succès' });
      } else {
        return res.status(500).json({ error: 'Erreur lors de la suppression du joueur' });
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
