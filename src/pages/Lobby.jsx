import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// Composants
import PlayerInfo from '../components/player/PlayerInfo';
import PlayerList from '../components/player/PlayerList';
import ThemeSelection from '../components/player/ThemeSelection';
import QuestionGrid from '../components/Questions/QuestionsGrid';
import ModalAnswer from '../components/Questions/ModalAnswer';

const Lobby = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [pseudo, setPseudo] = useState(localStorage.getItem('pseudo'));
  const [playerId, setPlayerId] = useState(localStorage.getItem('playerId'));
  const [players, setPlayers] = useState([]);
  const [themes, setThemes] = useState([]);
  const [playerTheme, setPlayerTheme] = useState(null);
  const [usedThemeIds, setUsedThemeIds] = useState([]);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChangingTurn, setIsChangingTurn] = useState(false);
  const [hasCardFlipped, setHasCardFlipped] = useState(false);
  const [currentPlayerThemeId, setCurrentPlayerThemeId] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);  // Initialisation avec 30 secondes
  const [flippedCards, setFlippedCards] = useState({});

  const checkIfPlayerExists = async () => {
    if (!playerId) {
      navigate(`/?sessionId=${sessionId}`);
      return;
    }

    const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
    const querySnapshot = await getDocs(playerQuery);

    if (querySnapshot.empty) {
      localStorage.removeItem('playerId');
      localStorage.removeItem('pseudo');
      navigate(`/?sessionId=${sessionId}`);
    }
  };

  const fetchPlayerTheme = async () => {
    if (!playerId) return;

    try {
      const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
      const querySnapshot = await getDocs(playerQuery);

      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0];
        const themeId = playerDoc.data().themeId;

        if (themeId) {
          const themeQuery = query(collection(db, 'themes'), where('id', '==', themeId));
          const themeSnapshot = await getDocs(themeQuery);

          if (!themeSnapshot.empty) {
            const themeDoc = themeSnapshot.docs[0];
            const theme = {
              id: themeDoc.id,
              name: themeDoc.data().name,
              color: themeDoc.data().color,
            };
            setPlayerTheme(theme);
            localStorage.setItem('playerTheme', JSON.stringify({ ...theme, playerId }));
          }
        } else {
          setIsThemeModalOpen(true);
        }
      } else {
        setIsThemeModalOpen(true);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du thème :', error);
    }
  };

  const updatePlayerTheme = async (theme) => {
    try {
      if (playerTheme && playerTheme.id !== theme.id) {
        setUsedThemeIds((prev) => prev.filter((id) => id !== playerTheme.id));
      }

      if (playerId) {
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          const docRef = doc(db, 'players', playerDoc.id);
          await updateDoc(docRef, { themeId: theme.id });
        }
      }

      setPlayerTheme(theme);
      localStorage.setItem('playerTheme', JSON.stringify(theme));  // Enregistrement dans localStorage
      setUsedThemeIds((prev) => [...prev, theme.id]);
      setIsThemeModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème :', error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('playerTheme');
    if (savedTheme) {
      setPlayerTheme(JSON.parse(savedTheme));
    }
  }, []);

  // Start Game
  const startGame = async () => {
    if (players.length < 2 || players.some((player) => !player.isReady)) {
      console.log("Il faut au moins 2 joueurs prêts pour démarrer.");
      return;
    }

    const gameRef = doc(db, 'games', sessionId);
    const gameSnapshot = await getDoc(gameRef);

    if (gameSnapshot.exists() && gameSnapshot.data().gameStarted) return;

    const playersData = players.map((player) => ({
      id: player.id,
      playerId: player.playerId,
      themeColor: player.themeColor || '#000000',
      isReady: player.isReady || false,
      themeId: player.themeId || '',
    }));

    await setDoc(gameRef, {
      gameStarted: true,
      currentTurnPlayerId: playersData[0].playerId,  // Le premier joueur qui commence
      players: playersData,
      flippedCards: {},  // Initialisation du champ flippedCards en tant qu'objet vide
      timer: 30,  // Temps du timer en secondes
      isTimerRunning: true,  // Le timer commence immédiatement
    }, { merge: true });

    setGameStarted(true);
    localStorage.setItem(`gameStarted_${sessionId}`, 'true');
  };

  /////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const gameRef = doc(db, "games", sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        setGameStarted(gameData.gameStarted || false);
        setCurrentTurnPlayerId(gameData.currentTurnPlayerId);
        setIsTimerRunning(gameData.isTimerRunning ?? false);
        setRemainingTime(gameData.timer);
        setFlippedCards(gameData.flippedCards || {});
        localStorage.setItem(`gameStarted_${sessionId}`, gameData.gameStarted ? 'true' : 'false');  // Sauvegarde pour reload
      }
    });
  
    return () => unsubscribe();
  }, [sessionId]);
  

  /////////////////////////////////////////////////////////////////////////////////////////// Change Turn

  const onNextTurn = async () => {
    if (isChangingTurn) return;
  
    setIsChangingTurn(true);
  
    try {
      const gameRef = doc(db, 'games', sessionId);
      const gameSnapshot = await getDoc(gameRef);
  
      if (!gameSnapshot.exists()) {
        console.error('❌ Game not found.');
        return;
      }
  
      const gameData = gameSnapshot.data();
      const currentPlayerIndex = gameData.players.findIndex(
        (player) => player.playerId === gameData.currentTurnPlayerId
      );
  
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.length;
      const nextPlayerId = gameData.players[nextPlayerIndex]?.playerId;
  
      if (!nextPlayerId) {
        console.error('❌ Next player not found.');
        return;
      }
  
      // Mise à jour du timer et autres infos dans Firestore
      console.log("📝 Mise à jour des données dans Firestore...");
      await updateDoc(gameRef, {
        currentTurnPlayerId: nextPlayerId,
        timer: 30,  // Réinitialisation du timer
        isTimerRunning: false,  // Le timer doit être arrêté ici
      });
  
      // Mise à jour des états locaux après la mise à jour Firestore
      setRemainingTime(30);  // Mettre à jour l'état local du timer
      setIsTimerRunning(true);  // Démarrer le timer localement
      setCurrentTurnPlayerId(nextPlayerId);
  
    } catch (error) {
      console.error('❌ Error while changing turn:', error);
    } finally {
      setIsChangingTurn(false);
      console.log("🔄 Changement de tour terminé.");
    }
  };
  
  /////////////////////////////////////////////////////////////////////////////////////////
  
  // Écouter les changements dans Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "games", sessionId), (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        // Vérifier si l'état du timer a changé
        if (gameData.isTimerRunning !== isTimerRunning) {
          setIsTimerRunning(gameData.isTimerRunning ?? false);
        }
  
        // Mettre à jour le timer si nécessaire
        if (gameData.timer !== remainingTime) {
          setRemainingTime(gameData.timer);
        }
  
        // Mettre à jour le joueur actuel
        setCurrentTurnPlayerId(gameData.currentTurnPlayerId);
      }
    });
  
    return () => unsubscribe();  // Nettoyer l'abonnement lorsque le composant se démonte
  }, [sessionId, isTimerRunning, remainingTime]);  // Dépendances


  /////////////////////////////////////////////////////////////////////////////////////////

  const handleLogout = async () => {
    try {
      if (playerId) {
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await deleteDoc(docRef);
        }
      }

      localStorage.clear();
      setUsedThemeIds((prev) => prev.filter((themeId) => themeId !== playerTheme?.id));
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////

  const availableThemes = themes.filter((theme) => !usedThemeIds.includes(theme.id) || playerTheme?.id === theme.id);

  useEffect(() => {
    checkIfPlayerExists();
    fetchPlayerTheme();
  }, [playerId, sessionId]);

  ///////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const playersQuery = query(collection(db, 'players'), where('sessionId', '==', sessionId));

    const unsubscribe = onSnapshot(playersQuery, (querySnapshot) => {
      const playersList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPlayers(playersList);

      const usedThemes = playersList.map((player) => player.themeId).filter((themeId) => themeId);
      setUsedThemeIds(usedThemes);
    });

    return () => unsubscribe();
  }, [sessionId]);

  ///////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'themes'), (querySnapshot) => {
      const themesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setThemes(themesList);
    });

    return () => unsubscribe();
  }, []);

  ///////////////////////////////////////////////////////////////////////////////////

  const handleQuestionSelect = async (question) => {
    // On met d'abord à jour l'état avec la question sélectionnée
    setSelectedQuestion(question);
    
    // On effectue les autres mises à jour nécessaires
    setHasCardFlipped(true);
    setIsTimerRunning(true);
    
    // On met à jour la base de données
    const gameRef = doc(db, 'games', sessionId);
    await updateDoc(gameRef, { selectedQuestion: question });
  };
  
  // Utilisation de useEffect pour ouvrir le modal après la mise à jour de selectedQuestion
  useEffect(() => {
    if (selectedQuestion) {
      setIsAnswerModalOpen(true);  // Ouvre le modal seulement après que selectedQuestion soit défini
    }
  }, [selectedQuestion]);  // Ce useEffect se déclenche chaque fois que selectedQuestion change
  
  ///

  const currentPlayer = players.find(player => player.playerId === currentTurnPlayerId);
  const currentPlayerThemeColor = currentPlayer ? currentPlayer.themeColor : "#ffffff";

  //

  const handleTimerStateChange = (newState) => {
    setIsTimerRunning(newState); // Mettez à jour l'état du timer
  };

  useEffect(() => {
    if (selectedQuestion && !isAnswerModalOpen) {
      setIsAnswerModalOpen(true);
    }
  }, [selectedQuestion, isAnswerModalOpen]);  

  return (
    <div className="lobby">
      <PlayerInfo
        pseudo={pseudo}
        onLogout={handleLogout}
        theme={playerTheme}
        gameStarted={gameStarted}
        onChangeTheme={() => setIsThemeModalOpen(true)}
      />
      <PlayerList
        players={players}
        sessionId={sessionId}
        onStartGame={startGame}
        gameStarted={gameStarted}
      />
      <ThemeSelection
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themes={availableThemes}
        usedThemeIds={usedThemeIds}
        onThemeUpdate={updatePlayerTheme}
      />
      {gameStarted && (
        <QuestionGrid
          sessionId={sessionId}
          currentTurnPlayerId={currentTurnPlayerId}
          playerId={playerId}
          onNextTurn={onNextTurn}
          onQuestionSelect={handleQuestionSelect}
          isTimerRunning={isTimerRunning}
        />
      )}
      <ModalAnswer
        isOpen={isAnswerModalOpen}
        question={selectedQuestion}
        onNextTurn={onNextTurn}
        playerId={playerId}
        currentTurnPlayerId={currentTurnPlayerId}
        currentPlayerThemeColor={currentPlayerThemeColor}
        currentPlayerThemeId={currentPlayerThemeId}
        isTimerRunning={isTimerRunning}
        hasCardFlipped={hasCardFlipped}
        onTimerStateChange={handleTimerStateChange}
        sessionId={sessionId}
      />
    </div>
  );
};

export default Lobby;
