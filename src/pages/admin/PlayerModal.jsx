import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import gsap from 'gsap';

const PlayersModal = ({ isOpen, onClose, modalRef }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
      gsap.fromTo(modalRef.current, { x: "-100%" }, { x: "0%", duration: 0.8, ease: "power3.out" });
    }
  }, [isOpen, modalRef]);

  const fetchPlayers = async () => {
    try {
      const playersSnapshot = await getDocs(collection(db, 'players'));
      const playersList = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(playersList);
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs :', error);
    }
  };

  const handleKickPlayer = async (playerId) => {
    try {
      await deleteDoc(doc(db, 'players', playerId));
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== playerId));
    } catch (error) {
      console.error('Erreur lors de la suppression du joueur :', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="playerModal" onClick={onClose}>
      <div className="playerModal__content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="content__header">
        <h2>Joueurs dans le Lobby</h2>
          <div class="info-icon">
            <span class="info-tooltip">Ici tu peux kick les joueurs que t'aimes pas !</span>
            ?
          </div>
        </div>
        {players.length === 0 ? (
          <p>Aucun joueur trouvé.</p>
        ) : (
          <ul>
            {players.map((player) => (
              <li key={player.id} className="player-item">
                <span>{player.pseudo || 'Nom inconnu'}</span>
                <span>{player.sessionId || 'Nom inconnu'}</span>
                <button onClick={() => handleKickPlayer(player.id)}>Expulser</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlayersModal;
