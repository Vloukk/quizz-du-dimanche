import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { updateDoc, doc, collection, query, where, onSnapshot } from 'firebase/firestore';

const PlayerList = ({ sessionId, onStartGame, gameStarted }) => {
  const [players, setPlayers] = useState([]);
  const playerId = localStorage.getItem('playerId'); // Récupérer l'ID du joueur connecté

  // Écouter les changements dans la collection Firestore
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('sessionId', '==', sessionId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(playersData);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Vérifier si tous les joueurs sont prêts et s'ils sont au moins 2
  useEffect(() => {
    if (players.length < 2) return; // ✅ Vérifie qu'il y a au moins 2 joueurs

    const allPlayersHaveReadyStatus = players.every(player => player.hasOwnProperty('isReady'));
    const allReady = allPlayersHaveReadyStatus && players.every(player => player.isReady === true);

    if (allReady) {
      onStartGame(); // Lancer la partie seulement si au moins 2 joueurs sont prêts
    }
  }, [players, onStartGame]);

  // Basculer l'état de "Prêt" pour le joueur
  const handleReadyToggle = async (playerId, isReady) => {
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, { isReady: !isReady });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état de prêt :", error);
    }
  };

  return (
    <div className="playerList">
      {players.length > 0 ? (
        <ul className="playerList__list">
          {players.map((player) => (
            <li key={player.id} className="playerList__item">
              <span 
                className={`status-indicator ${player.isReady ? 'ready' : 'not-ready'}`}
              />
              <span><p>{player.pseudo || 'Nom inconnu'}</p></span>
              {gameStarted ? (
                <span>{player.score || 0}</span> 
              ) : (
                player.playerId === playerId && (
                  <button
                    onClick={() => handleReadyToggle(player.id, player.isReady)}
                    disabled={player.isReady || player.themeId === undefined}  
                  >
                    {player.isReady ? 'Annuler' : 'Prêt'}
                  </button>
                )
              )}
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
