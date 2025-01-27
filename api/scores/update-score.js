import { updatePlayerScore } from '../../players'; // Importer ta fonction pour mettre à jour le score

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { playerId, newScore } = req.body;
    if (!playerId || newScore === undefined) {
      return res.status(400).json({ message: "PlayerId et Score sont requis" });
    }
    
    // Appeler la fonction pour mettre à jour le score
    try {
      await updatePlayerScore(playerId, newScore);
      res.status(200).json({ message: "Score mis à jour" });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  } else {
    res.status(405).json({ message: "Méthode non autorisée" });
  }
}
