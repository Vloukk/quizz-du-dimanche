const PlayerLobby = ({ gameId, players, handleReadyToggle, allReady, pseudo }) => {
  if (!players || players.length === 0) {
    return <p>Aucun joueur n'a rejoint la partie.</p>;
  }

  return (
    <div>
      <h1>Game Room du Jeu {gameId}</h1>
      <ul>
        {players.map((player) => (
          <li key={player._id}>
            {player.pseudo} - {player.isReady ? "Prêt" : "Pas prêt"}

            {/* Afficher le bouton "prêt" seulement pour le joueur actuel */}
            {player.pseudo === pseudo && !player.isReady && (
              <button onClick={() => handleReadyToggle(player)}>
                {player.isReady ? "Vous êtes prêt" : "Être prêt"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {/* Le bouton de démarrage de la partie est visible seulement si tous les joueurs sont prêts */}
      {allReady && <button>Commencer la partie</button>}
    </div>
  );
};

export default PlayerLobby;
