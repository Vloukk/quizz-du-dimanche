import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const usePlayerManager = (sessionId) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('sessionId', '==', sessionId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersData = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() });
      });
      setPlayers(playersData);
    });

    return () => unsubscribe();
  }, [sessionId]);

  return players;
};

const PlayerManager = ({ sessionId }) => {
  const players = usePlayerManager(sessionId);

  return (
    <div>
      <ul>
        {players.map(player => (
          <li key={player.id}>
            {player.pseudo} - {player.isReady ? 'Ready' : 'Not Ready'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerManager;
