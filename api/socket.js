import { Server } from "socket.io";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const io = new Server(3001);  // Création du serveur Socket.io

let db;
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db("quiz");
    console.log("MongoDB connected");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", (socket) => {
  console.log("Nouvelle connexion WebSocket :", socket.id);

  // Écouter l'événement "playerLeft" pour supprimer le joueur de la base
  // Côté serveur : gestion de la déconnexion via WebSocket
  socket.on("playerLeft", async ({ pseudo, gameId }) => {
    console.log(`Événement "playerLeft" reçu pour le pseudo: ${pseudo} du jeu ${gameId}`);
    
    try {
      const playersCollection = db.collection("players");
  
      // Supprimer le joueur de la base de données
      const result = await playersCollection.findOneAndDelete({ pseudo, gameId });
  
      if (result.value) {
        console.log(`${pseudo} a quitté le jeu ${gameId}`);
        
        // Mettre à jour tous les joueurs restants dans le même lobby
        const players = await playersCollection.find({ gameId }).toArray();
        io.to(gameId).emit("updatePlayers", players); // Notifier les autres joueurs
      } else {
        console.log(`Aucun joueur trouvé pour ${pseudo} dans le jeu ${gameId}`);
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion du joueur :", err);
    }
  });
  
  

  // Lorsqu'un client se déconnecte (déconnexion explicite)
  socket.on("disconnect", async () => {
    try {
      const playersCollection = db.collection("players");
  
      // Trouver et supprimer le joueur en utilisant le socketId
      const result = await playersCollection.findOneAndDelete({ socketId: socket.id });
      if (result.value) {
        console.log(`${result.value.pseudo} a quitté le jeu`);
  
        // Mettre à jour tous les joueurs restants dans le même lobby
        const players = await playersCollection.find({ gameId: result.value.gameId }).toArray();
        io.to(result.value.gameId).emit("updatePlayers", players);
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion du joueur :", err);
    }
  });
  
});

console.log("WebSocket server listening on port 3001");
