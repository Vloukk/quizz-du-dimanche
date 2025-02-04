import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import QuestionCard from './QuestionsCard';

const shuffleArray = (array, sessionId) => {
  const shuffledArray = [...array];
  let seed = 0;
  
  for (let i = 0; i < sessionId.length; i++) {
    seed += sessionId.charCodeAt(i);
  }

  const randomize = (i) => Math.sin(seed + i) * 10000 % 1;

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(randomize(i) * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
};

const QuestionGrid = ({ themes, playerId, onQuestionSelect, sessionId, onNextTurn }) => {
  const [questions, setQuestions] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});
  const [hasCardFlipped, setHasCardFlipped] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);
  const [timer, setTimer] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);


  // Synchronisation du jeu avec Firestore
  useEffect(() => {
    console.log("🔄 [useEffect] Exécution !"); 
    console.log("📌 sessionId:", sessionId);
    console.log("📌 currentTurnPlayerId (avant mise à jour):", currentTurnPlayerId);
    console.log("📌 gameStarted:", gameStarted);
  
    const gameRef = doc(db, "games", sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        const { currentTurnPlayerId: newCurrentTurnPlayerId, gameStarted: newGameStarted } = gameData;
  
        if (newCurrentTurnPlayerId !== currentTurnPlayerId) {
          console.log("✅ Mise à jour du joueur actif :", newCurrentTurnPlayerId);
          setCurrentTurnPlayerId(newCurrentTurnPlayerId);
        } else {
          console.log("ℹ️ Aucun changement de joueur.");
        }
  
        if (newGameStarted && !gameStarted) {
          console.log("🚀 Le jeu vient de commencer !");
          setGameStarted(true);
          localStorage.setItem(`gameStarted_${sessionId}`, "true");
        }
      } else {
        console.log("⚠️ Aucune donnée reçue de Firestore !");
      }
    });
  
    return () => {
      console.log("🛑 [useEffect] Cleanup : Désabonnement de Firestore !");
      unsubscribe();
    };
  }, [sessionId, currentTurnPlayerId, gameStarted]); // Déclenche l'effet à chaque changement de tour ou début du jeu
  

  //////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const gameRef = doc(db, 'games', sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        const flippedCards = gameData.flippedCards || {};  // Valeur par défaut un objet vide
        setFlippedCards(flippedCards);
      }
    });
    return () => unsubscribe();  // Cleanup
  }, [sessionId]);
  

  ////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const gameRef = doc(db, 'games', sessionId);
  
    // Écouter les mises à jour du jeu en temps réel
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      
      if (gameData) {
        const { flippedCards = [] } = gameData;  // Valeur par défaut pour flippedCards
  
        // Mettre à jour l'état local avec les cartes retournées
        setFlippedCards(flippedCards.reduce((acc, cardId) => {
          acc[cardId] = true;
          return acc;
        }, {}));
      }
    });
  
    return () => unsubscribe();  // Nettoyage de l'abonnement lors du démontage
  }, [sessionId]);   

  /////

  // Synchronisation du statut du jeu avec le localStorage
  useEffect(() => {
    const storedGameStarted = localStorage.getItem(`gameStarted_${sessionId}`);
    if (storedGameStarted === 'true' && !gameStarted) {
      const gameRef = doc(db, 'games', sessionId);
      getDoc(gameRef).then((docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().gameStarted) {
          setGameStarted(true);
          localStorage.setItem(`gameStarted_${sessionId}`, 'true');
        }
      }).catch(console.error);
    }
  }, [sessionId, gameStarted]);

  // Récupérer les questions depuis Firestore ou localStorage
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const storedQuestions = localStorage.getItem(`questions_${sessionId}`);
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
        setLoading(false);
        return;
      }

      const themesSnapshot = await getDocs(collection(db, 'themes'));
      if (themesSnapshot.empty) {
        setLoading(false);
        return;
      }

      let allQuestions = [];
      themesSnapshot.forEach((themeDoc) => {
        const themeData = themeDoc.data();
        if (themeData.questions?.length) {
          themeData.questions.forEach((q, index) => {
            allQuestions.push({
              id: `${themeDoc.id}-${index}`,
              question: q.question,
              answer: q.correctAnswer,
              color: themeData.color,
            });
          });
        }
      });

      setQuestions(allQuestions);
      setLoading(false);
    };

    if (gameStarted && questions.length === 0) {
      fetchQuestions();
    }
  }, [gameStarted, questions, sessionId]);

  // Récupérer et sauvegarder l'état des cartes retournées
  useEffect(() => {
    const savedFlippedCards = localStorage.getItem(`flippedCards_${sessionId}`);
    if (savedFlippedCards) {
      setFlippedCards(JSON.parse(savedFlippedCards));
    }
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(`flippedCards_${sessionId}`, JSON.stringify(flippedCards));
  }, [flippedCards, sessionId]);

  // Gérer l'interaction avec les cartes
  const handleCardClick = (question) => {
    if (hasCardFlipped || playerId !== currentTurnPlayerId || isTimerRunning || flippedCards[question.id]) return;
  
    setHasCardFlipped(true);
    setIsTimerRunning(true);
    setRemainingTime(30);  // Le temps restant est initialisé à 30 secondes
    setSelectedQuestion(question);  // Met à jour la question sélectionnée
    onQuestionSelect(question);
  
    const newTimer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(newTimer);
          setIsTimerRunning(false);
          setHasCardFlipped(false);
          onNextTurn();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    setTimer(newTimer);
  
    // Mise à jour de l'état des cartes retournées
    setFlippedCards((prevState) => ({
      ...prevState,
      [question.id]: true,
    }));
  
    // Assure-toi que la question est bien transmise
    setIsAnswerModalOpen(true);  // Ouvre la modal pour la réponse
  };

  // Nettoyage du timer
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  // Si le jeu n'est pas commencé ou questions en cours de chargement
  if (loading) return <div>Chargement des questions...</div>;
  if (!gameStarted) return <div>Le jeu n'a pas encore commencé.</div>;
  if (questions.length === 0) return <div>Chargement des questions...</div>;

  ////

  return (
    <div className="questionsGrid">
      <div className="question-grid">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            questionData={q}
            playerId={playerId}
            onCardClick={() => handleCardClick(q)}
            disabled={playerId !== currentTurnPlayerId || flippedCards[q.id] || hasCardFlipped}
            currentTurnPlayerId={currentTurnPlayerId}
            flippedCards={flippedCards}
            gameId={sessionId}
          />
        ))}
      </div>
      <div className="timer">
        {isTimerRunning && <p>Temps restant : {remainingTime} secondes</p>}
      </div>
    </div>
  );
};

export default QuestionGrid;
