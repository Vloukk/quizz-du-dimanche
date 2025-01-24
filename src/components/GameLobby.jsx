import React, { useState, useEffect } from "react";

const GameLobby = ({ gameId, gameData }) => {
  const [players, setPlayers] = useState(gameData.players);
  const [isReady, setIsReady] = useState(false);

  // Gérer le bouton "Prêt"
  const handleReadyToggle = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isReady: !isReady }),
      });
      const data = await response.json();
      if (data.success) {
        setIsReady(!isReady);  // Mettre à jour l'état "prêt"
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de prêt", error);
    }
  };

  // Vérifier si tout le monde est prêt
  const allReady = players.every(player => player.isReady);
  const gameStatus = gameData.status;

  return (
    <div>
      <h2>Lobby de la partie {gameId}</h2>
      {gameStatus === "waiting" ? (
        <p>La partie est en attente de joueurs...</p>
      ) : (
        <p>La partie est déjà en cours.</p>
      )}
      <ul>
        {players.map((player) => (
          <li key={player.pseudo}>
            {player.pseudo} - {player.isReady ? "Prêt" : "Pas prêt"}
          </li>
        ))}
      </ul>
      <button onClick={handleReadyToggle} disabled={isReady}>
        {isReady ? "Vous êtes prêt" : "Être prêt"}
      </button>
      {allReady && <button>Commencer la partie</button>}
    </div>
  );
};

export default GameLobby;
