import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { pseudo, gameId, sessionId } = req.body;

    console.log("Données reçues pour l'ajout du joueur : ", { pseudo, gameId, sessionId });

    if (!pseudo || !gameId || !sessionId) {
      return res.status(400).json({ error: 'Pseudo, gameId et sessionId sont requis' });
    }

    try {
      const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      const db = client.db('quiz');
      const playersCollection = db.collection('players');

      // Vérifier si gameId est un ObjectId valide
      if (!ObjectId.isValid(gameId)) {
        client.close();
        return res.status(400).json({ error: 'GameId invalide' });
      }

      // Nettoyer les joueurs inactifs (10 minutes)
      const inactiveThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
      await playersCollection.deleteMany({ lastActive: { $lt: inactiveThreshold } });

      // Vérification si un joueur existe déjà avec le même sessionId
      const existingPlayer = await playersCollection.findOne({ sessionId, gameId });
      if (existingPlayer) {
        // Réutiliser la session existante
        console.log("Session existante réutilisée :", existingPlayer);
        client.close();
        return res.status(200).json({ success: true, playerId: existingPlayer._id, message: 'Session réutilisée.' });
      }

      // Ajouter un nouveau joueur
      const newPlayer = {
        pseudo,
        gameId: new ObjectId(gameId),
        sessionId,
        lastActive: new Date(),
        isReady: false,
      };

      const result = await playersCollection.insertOne(newPlayer);
      console.log("Résultat de l'insertion :", result);

      client.close();

      if (result.insertedId) {
        return res.status(201).json({ success: true, playerId: result.insertedId });
      } else {
        return res.status(500).json({ error: 'Erreur lors de l\'ajout du joueur' });
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  } else {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
