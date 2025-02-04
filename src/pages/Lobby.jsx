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
    if (!playerId) {
      console.log("Player ID non défini");
      return;
    }
  
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
      if (playerTheme) {
        setUsedThemeIds((prev) => prev.filter((id) => id !== playerTheme.id));
      }
  
      if (playerId) {
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);
  
        if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          const docRef = doc(db, 'players', playerDoc.id);
  
          console.log("Mise à jour du thème pour le joueur :", playerId, theme);
          await updateDoc(docRef, { themeId: theme.id }); // On met à jour l'ID du thème dans la base
        }
      }
  
      setPlayerTheme({ id: theme.id, name: theme.name, color: theme.color });
      localStorage.setItem('playerTheme', JSON.stringify(theme)); // Enregistrement dans localStorage
  
      setUsedThemeIds((prev) => [...prev, theme.id]);
      setIsThemeModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème :', error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('playerTheme');
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      setPlayerTheme(parsedTheme); // Réinitialise le thème depuis le localStorage
    }
  }, []); // Ce useEffect ne s'exécute qu'une fois lors du chargement initial

  //////////////////////////////////////////////////////////////////////////////////////////

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
  
    // Assurez-vous que flippedCards est initialisé à un objet vide
    await setDoc(gameRef, {
      gameStarted: true,
      currentTurnPlayerId: playersData[0].playerId,
      players: playersData,
      flippedCards: {}  // Initialisation du champ flippedCards en tant qu'objet vide
    }, { merge: true });
  
    setGameStarted(true);
    localStorage.setItem(`gameStarted_${sessionId}`, 'true');
  };  

  //////////////////////////////////////////////////////////////////////////////////////////

  const onNextTurn = async () => {
    if (isChangingTurn) return;

    setIsChangingTurn(true);
    console.log("🔄 Passage au tour suivant !");

    try {
        const gameRef = doc(db, 'games', sessionId);
        const gameSnapshot = await getDoc(gameRef);

        if (!gameSnapshot.exists()) {
            console.error('❌ Le jeu n\'existe pas ou n\'a pas été trouvé.');
            return;
        }

        const gameData = gameSnapshot.data();

        // Vérifier que la partie a bien démarré
        if (!gameData.gameStarted) {
            console.warn("⚠️ La partie n'est pas encore commencée !");
            return;
        }

        const currentPlayerIndex = gameData.players.findIndex(
            (player) => player.playerId === gameData.currentTurnPlayerId
        );
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.length;
        const nextPlayerId = gameData.players[nextPlayerIndex]?.playerId;

        // Vérification de la validité du joueur suivant
        if (!nextPlayerId) {
            console.error('❌ Le joueur suivant n\'a pas été trouvé.');
            return;
        }

        console.log(`🔄 Nouveau joueur actif : ${nextPlayerId}`);

        await updateDoc(gameRef, {
            currentTurnPlayerId: nextPlayerId,
        });

        // 🔹 NE PAS mettre à jour `setCurrentTurnPlayerId(nextPlayerId)`, Firestore gère ça !
        
        // 🛑 Fermer la modal et réinitialiser la question après le tour
        setSelectedQuestion(null);
        setIsAnswerModalOpen(false);
        setHasCardFlipped(false);

    } catch (error) {
        console.error('❌ Erreur lors du changement de tour :', error);
    } finally {
        setIsChangingTurn(false);
    }
  };



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

      localStorage.removeItem('sessionId');
      localStorage.removeItem('pseudo');
      localStorage.removeItem('playerId');
      localStorage.removeItem('playerTheme');

      setUsedThemeIds((prev) => prev.filter((themeId) => themeId !== playerTheme?.id));
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  const availableThemes = themes.filter((theme) => !usedThemeIds.includes(theme.id) || playerTheme?.id === theme.id);

  useEffect(() => {
    checkIfPlayerExists();
  }, [playerId, sessionId, navigate]);

  useEffect(() => {
    fetchPlayerTheme();
  }, [playerId]);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'themes'), (querySnapshot) => {
      const themesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setThemes(themesList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const gameRef = doc(db, 'games', sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        setGameStarted(gameData.gameStarted);
        setCurrentTurnPlayerId(gameData.currentTurnPlayerId);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  ///

  const handleQuestionSelect = (question) => {
    console.log("Question sélectionnée dans Lobby.jsx :", question);
    setSelectedQuestion(question);
    setIsAnswerModalOpen(true);
  };
  
  //
  const currentPlayer = players.find(player => player.playerId === currentTurnPlayerId);
  const currentPlayerThemeColor = currentPlayer ? currentPlayer.themeColor : "#ffffff";


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
        />
      )}
      <ModalAnswer
        isOpen={isAnswerModalOpen}
        question={selectedQuestion}
        onNextTurn={onNextTurn}
        playerId={playerId}
        currentTurnPlayerId={currentTurnPlayerId}
        currentPlayerThemeColor={currentPlayerThemeColor}
      />
    </div>
  );
};

export default Lobby;
