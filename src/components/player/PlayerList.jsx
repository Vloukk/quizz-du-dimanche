import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Assure-toi que tu as bien l'instance de Firestore
import { collection, query, where, getDocs } from 'firebase/firestore';

const PlayerList = ({ sessionId }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchPlayers = async () => {
      try {
        // Requête pour récupérer les joueurs dans ce lobby (en fonction du sessionId)
        const playersQuery = query(collection(db, 'players'), where('sessionId', '==', sessionId));
        const querySnapshot = await getDocs(playersQuery);
        
        console.log("Query snapshot:", querySnapshot);

        // Vérifie si la requête retourne des documents
        if (!querySnapshot.empty) {
          // Récupère tous les joueurs avec leurs données (pseudo, id, etc.)
          const playersList = querySnapshot.docs.map(doc => ({
            id: doc.id,  // ID du joueur
            pseudo: doc.data().pseudo, // Pseudo du joueur
            // Ajoute d'autres champs ici si nécessaire
          }));
          console.log("Joueurs récupérés:", playersList); // Log des joueurs récupérés
          setPlayers(playersList);
        } else {
          console.log("Aucun joueur trouvé pour ce sessionId.");
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des joueurs:', error);
      }
    };

    fetchPlayers();
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
