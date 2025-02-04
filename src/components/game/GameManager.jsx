import { useState, useEffect } from 'react';

const useGameManager = (players, onStartGame) => {
  const [gameStarted, setGameStarted] = useState(false);

  const checkIfAllPlayersReady = () => {
    const allPlayersReady = players.every(player => player.isReady && player.themeId);
    return allPlayersReady;
  };

  const startGame = () => {
    if (checkIfAllPlayersReady()) {
      setGameStarted(true);
      let countdown = 5;
      const countdownInterval = setInterval(() => {
        if (countdown > 0) {
          countdown--;
        } else {
          clearInterval(countdownInterval);
          onStartGame();
        }
      }, 1000);
    } else {
      alert('All players must be ready and have selected a theme!');
    }
  };

  return {
    gameStarted,
    startGame,
  };
};

const GameManager = ({ players, onStartGame }) => {
  const { gameStarted, startGame } = useGameManager(players, onStartGame);

  return (
    <div>
      {gameStarted ? (
        <p>Game Started!</p>
      ) : (
        <button onClick={startGame}>Start Game</button>
      )}
    </div>
  );
};

export default GameManager;
