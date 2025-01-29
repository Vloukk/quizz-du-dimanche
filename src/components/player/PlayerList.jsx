// PlayerList.jsx

import React from 'react';

const PlayerList = ({ players }) => {
  console.log("Players dans PlayerList:", players);  // Log ici aussi pour confirmer que les données arrivent
  return (
    <div className="playerList">
      <h2>Joueurs dans ce lobby :</h2>
      {players && players.length > 0 ? (
        <ul className="playerList__list">
          {players.map((player) => (
            <li key={player.id}>
              {player.pseudo || 'Nom inconnu'}  {/* Vérifie si `pseudo` existe */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun joueur dans ce lobby.</p>
      )}
    </div>
  );
};


export default PlayerList;


