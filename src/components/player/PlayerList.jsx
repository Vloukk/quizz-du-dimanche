import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Assurez-vous que vous avez configuré Firebase
import { updateDoc, doc, collection, query, where, onSnapshot } from 'firebase/firestore';

const PlayerList = ({ sessionId, onStartGame, gameStarted }) => {
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(localStorage.getItem('playerId')); // ID du joueur connecté

  // Vérifier si playerId existe dans le localStorage
  useEffect(() => {
    if (!playerId) {
      console.error("Aucun playerId trouvé dans le localStorage !");
    }
  }, [playerId]);

  // Écouter les changements dans la collection des joueurs en fonction du sessionId
  useEffect(() => {
    const playersRef = collection(db, 'players');
    
    // Créer une requête pour filtrer les joueurs selon le sessionId
    const q = query(playersRef, where('sessionId', '==', sessionId));

    // Ecouteur en temps réel des changements dans Firestore
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersData = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() });
      });
      setPlayers(playersData);
    });

    // Clean up l'écouteur quand le composant est démonté
    return () => unsubscribe();
  }, [sessionId]);

  // Vérifier si tous les joueurs sont prêts
  useEffect(() => {
    if (players.length === 0) return; // Empêche d'exécuter si aucun joueur n'est encore chargé
  
    // Vérifie si tous les joueurs ont un isReady défini et qu'il est à true
    const allPlayersHaveReadyStatus = players.every(player => player.hasOwnProperty('isReady'));
    const allReady = allPlayersHaveReadyStatus && players.every(player => player.isReady === true);
  
    if (allReady) {
      onStartGame(); // Lancer la partie uniquement si tous les joueurs sont prêts
    }
  }, [players, onStartGame]);
  

  const handleReadyToggle = async (playerId, isReady) => {
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, { isReady: !isReady }); // Change l'état du joueur
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état de prêt du joueur:", error);
    }
  };

  return (
    <div className="playerList">
      <h2>Joueurs dans ce lobby :</h2>
      {players.length > 0 ? (
        <ul className="playerList__list">
          {players.map((player) => (
            <li key={player.id}>
              {player.pseudo || 'Nom inconnu'} -{' '}
              <span style={{ color: player.isReady ? 'green' : 'red' }}>
                {player.isReady ? 'Prêt' : 'Pas prêt'}
              </span>
              {gameStarted ? (  
                // Afficher les scores une fois la partie lancée
                <span>Score: {player.score || 0}</span> 
              ) : (
                player.playerId === localStorage.getItem('playerId') && (
                  <button
                onClick={() => handleReadyToggle(player.id, player.isReady)}
                disabled={player.isReady === true || player.themeId === undefined}  // Ne permet pas de changer "Prêt" si déjà prêt ou sans thème
              >
                {player.isReady ? 'Pas prêt' : 'Prêt'}
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
