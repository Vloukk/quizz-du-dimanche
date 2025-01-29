import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Assure-toi que tu as bien l'instance de Firestore
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const PlayerList = ({ sessionId }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    // Créer une requête pour récupérer les joueurs dans ce lobby
    const playersQuery = query(collection(db, 'players'), where('sessionId', '==', sessionId));

    // Utiliser onSnapshot pour écouter les changements en temps réel
    const unsubscribe = onSnapshot(playersQuery, (querySnapshot) => {
      // Vérifie si la requête retourne des documents
      if (!querySnapshot.empty) {
        // Récupère tous les joueurs avec leurs données (pseudo, id, etc.)
        const playersList = querySnapshot.docs.map(doc => ({
          id: doc.id,  // ID du joueur
          pseudo: doc.data().pseudo, // Pseudo du joueur
          // Ajoute d'autres champs ici si nécessaire
        }));

        console.log("Joueurs récupérés en temps réel:", playersList); // Log des joueurs récupérés
        setPlayers(playersList);
      } else {
        console.log("Aucun joueur trouvé pour ce sessionId.");
      }
    });

    // Retourne une fonction de nettoyage pour arrêter l'écouteur lorsque le composant est démonté
    return () => unsubscribe();

  }, [sessionId]);

  return (
    <div className='playerList'>
      <h2>Joueurs dans ce lobby :</h2>
      {players.length > 0 ? (
        <ul className='playerList__list'>
          {players.map((player, index) => (
            <li key={index}>
              {player.pseudo} {/* Affiche le pseudo du joueur */}
              {/* Affiche d'autres informations si nécessaire, par exemple player.id */}
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
