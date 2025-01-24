import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'GameId requis' });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      const db = client.db('quiz');
      const playersCollection = db.collection('players');

      // Vérifier si gameId est bien un ObjectId valide
      if (!ObjectId.isValid(gameId)) {
        return res.status(400).json({ error: 'GameId invalide' });
      }

      // Récupérer les joueurs associés au gameId
      const players = await playersCollection.find({ gameId: new ObjectId(gameId) }).toArray();

      if (!players || players.length === 0) {
        return res.status(404).json([]); // Aucun joueur trouvé, renvoyer tableau vide
      }

      client.close();

      return res.status(200).json(players); // Retourne les joueurs
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' }); // Retourne une erreur serveur
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
