import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
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
      const playersCollection = db.collection('players');

      // Supprime le pseudo de la collection "players"
      const result = await playersCollection.deleteOne({ pseudo });

      client.close();

      if (result.deletedCount > 0) {
        console.log(`Joueur ${pseudo} supprimé avec succès.`);
        return res.status(200).json({ success: true });
      } else {
        console.log(`Aucun joueur trouvé avec le pseudo: ${pseudo}`);
        return res.status(404).json({ error: 'Pseudo non trouvé' });
      }
    } catch (error) {
      console.error('Erreur serveur lors de la suppression du pseudo:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

