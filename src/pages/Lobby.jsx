import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerLobby from "../components/PlayerLobby";
import { io } from "socket.io-client";

const Lobby = () => {
  const { gameId } = useParams();
  const [players, setPlayers] = useState([]);
  const [pseudo, setPseudo] = useState(""); // Pseudo du joueur

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
  
    // Récupérer le pseudo à partir du sessionStorage
    const storedPseudo = sessionStorage.getItem("pseudo");
    if (storedPseudo) {
      setPseudo(storedPseudo); // Mettre à jour l'état avec le pseudo stocké
    }
  
    // Fonction pour récupérer les joueurs
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/players/get-players?gameId=${gameId}`);
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("La réponse n'est pas au format JSON");
        }
  
        const data = await response.json();
        console.log("Players fetched:", data); // Log pour vérifier la réponse
        if (Array.isArray(data)) {
          setPlayers(data); // Mettre à jour l'état avec les joueurs
        } else {
          setPlayers([]); // Si ce n'est pas un tableau, on met players à un tableau vide
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des joueurs", error);
      }
    };
  
    fetchPlayers();
  
    // Fonction de nettoyage pour supprimer le pseudo à la fermeture de la page
    // Lors de la fermeture de la page
const handleBeforeUnload = (event) => {
  const storedPseudo = sessionStorage.getItem("pseudo");
  if (storedPseudo) {
    console.log(`Le joueur ${storedPseudo} quitte la page...`);

    // Envoi de l'événement via Socket.io
    socket.emit("playerLeft", { pseudo: storedPseudo, gameId });

    // Utilisation de fetch pour supprimer le joueur (au lieu de sendBeacon)
    const data = JSON.stringify({ pseudo: storedPseudo });
    fetch("/api/players/remove-player", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(`Joueur ${storedPseudo} supprimé avec succès.`);
        } else {
          console.error("Erreur lors de la suppression du joueur:", data.error);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la requête de suppression:", error);
      });

    // Nécessaire pour certains navigateurs
    event.preventDefault();
    event.returnValue = "";
  }
};
    window.addEventListener("beforeunload", handleBeforeUnload);
      
        // Nettoyage de l'événement et de la connexion Socket.io
        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          socket.disconnect(); // Fermer la connexion WebSocket à la fermeture du composant
        };
  }, [gameId]);
  

  const handleReadyToggle = async (player) => {
    console.log("Ready toggle for player:", player); // Vérifier si handleReadyToggle est appelé

    try {
      const response = await fetch("/api/players/ready", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player._id, // Utiliser l'ID du joueur
          isReady: !player.isReady, // Inverser l'état de "prêt"
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Mettre à jour l'état local des joueurs
        setPlayers((prevPlayers) =>
          prevPlayers.map((p) =>
            p._id === player._id
              ? { ...p, isReady: !p.isReady } // Inverser l'état "isReady"
              : p
          )
        );
      } else {
        console.error("Impossible de mettre à jour le statut de prêt");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de prêt", error);
    }
  };

  // Vérifie si tous les joueurs sont prêts
  const allReady = players && players.every((player) => player.isReady);

  return (
    <div>
      <h1>Lobby du jeu {gameId}</h1>
      <p>Pseudo du joueur actuel: {pseudo}</p> {/* Afficher le pseudo */}
      <PlayerLobby
        gameId={gameId}
        players={players}
        handleReadyToggle={handleReadyToggle}
        allReady={allReady}
        pseudo={pseudo} // Passe le pseudo du joueur actuel
      />
    </div>
  );
};

export default Lobby;
