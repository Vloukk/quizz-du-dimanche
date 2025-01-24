import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'POST') {
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
      const gamesCollection = db.collection('games');
      const playersCollection = db.collection('players');

      // Vérifier s'il existe déjà un jeu en cours
      let game = await gamesCollection.findOne({});

      if (!game) {
        // Crée une nouvelle partie s'il n'y en a pas
        game = { players: [], status: 'waiting' };
        const result = await gamesCollection.insertOne(game);
        game._id = result.insertedId;
      }

      // Vérifier si le pseudo existe déjà parmi les joueurs
      const playerExists = await playersCollection.findOne({ pseudo });

      if (playerExists) {
        client.close();
        return res.status(400).json({ error: 'Ce pseudo a déjà rejoint un jeu' });
      }

      // Créer un document pour le joueur dans la collection `players`
      const player = {
        pseudo,
        isReady: false,
        gameId: game._id, // Lien vers l'ID du jeu auquel il appartient
      };

      await playersCollection.insertOne(player);

      // Répondre avec succès et l'ID du jeu
      client.close();
      return res.status(200).json({ success: true, gameId: game._id });
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'ajout au lobby' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
