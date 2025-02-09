import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import QuestionCard from './QuestionsCard';

const QuestionGrid = ({ playerId, onQuestionSelect, sessionId, isTimerRunning }) => {
  const [questions, setQuestions] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState({});
  const [hasCardFlipped, setHasCardFlipped] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Synchronisation du jeu avec Firestore
  useEffect(() => {
    const gameRef = doc(db, "games", sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        const { currentTurnPlayerId: newCurrentTurnPlayerId, gameStarted: newGameStarted } = gameData;
        if (newCurrentTurnPlayerId !== currentTurnPlayerId) {
          console.log("Données du jeu récupérées :", gameData);
          setCurrentTurnPlayerId(newCurrentTurnPlayerId);
        }
        setGameStarted(newGameStarted);
      }
    });

    return () => unsubscribe();
  }, [sessionId, currentTurnPlayerId, gameStarted]);

  const shuffleQuestions = (questions) => {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  };
  
  // Dans le useEffect de récupération des questions :
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const storedQuestions = localStorage.getItem(`questions_${sessionId}`);
      
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions);
        console.log('Questions chargées depuis localStorage:', parsedQuestions);
        setQuestions(shuffleQuestions(parsedQuestions));
        setLoading(false);
        return;
      }
    
      const themesSnapshot = await getDocs(collection(db, 'themes'));
    
      if (!themesSnapshot.empty) {
        let allQuestions = [];
        themesSnapshot.forEach((themeDoc) => {
          const themeData = themeDoc.data();
          
          themeData.questions?.forEach((q, index) => {
            const questionData = {
              id: `${themeDoc.id}-${index}`,
              question: q.question,
              correctAnswers: q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []),
              color: themeData.color,
            };
    
            // Log pour vérifier les bonnes réponses
            console.log(`Question "${q.question}" -> Réponses correctes:`, questionData.correctAnswers);
            
            allQuestions.push(questionData);
          });
        });
    
        console.log('Toutes les questions récupérées:', allQuestions);
        setQuestions(shuffleQuestions(allQuestions));
        localStorage.setItem(`questions_${sessionId}`, JSON.stringify(allQuestions));
      } else {
        console.log('Aucun thème trouvé dans Firestore.');
      }
    
      setLoading(false);
    };    
  
    if (gameStarted) {
      fetchQuestions();
    }
  }, [sessionId, gameStarted]);
  
     

  // Synchronisation des flippedCards
  useEffect(() => {
    const gameRef = doc(db, 'games', sessionId);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const gameData = docSnapshot.data();
      if (gameData) {
        setFlippedCards(gameData.flippedCards || {});
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (Object.keys(flippedCards).length > 0) {
      localStorage.setItem(`flippedCards_${sessionId}`, JSON.stringify(flippedCards));
    }
  }, [flippedCards, sessionId]);

  /////////////////////////////////////////////////////////////////////////////////////////// Quand on clique sur une carte

  const handleCardClick = async (question) => {
    if (flippedCards[question.id] || playerId !== currentTurnPlayerId || hasCardFlipped) {
      return;
    }

    console.log('Vérification des réponses correctes pour la question:', question);
    if (!question.correctAnswers || question.correctAnswers.length === 0) {
      console.error("❌ Aucune réponse correcte trouvée pour la question.");
      return;
    }
    
    // Mise à jour immédiate en local pour éviter un délai d'affichage
    setHasCardFlipped(true);
    setSelectedQuestion(question);
    onQuestionSelect(question);
  
    // Vérifier que la question contient les bonnes réponses
    if (!question.correctAnswers || question.correctAnswers.length === 0) {
      console.error("❌ Aucune réponse correcte trouvée pour la question.");
      return;
    }
  
    // Mise à jour Firestore pour marquer la carte comme retournée
    const updatedFlippedCards = { ...flippedCards, [question.id]: true };
    const gameRef = doc(db, "games", sessionId);
  
    try {
      await updateDoc(gameRef, { flippedCards: updatedFlippedCards });
      setFlippedCards(updatedFlippedCards);
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour Firestore :", error);
      setHasCardFlipped(false);  // Revenir à false si erreur
      return;
    }
  
    // Démarrer le timer si nécessaire
    if (!isTimerRunning && playerId === currentTurnPlayerId) {
      try {
        await updateDoc(gameRef, { timer: 30, isTimerRunning: true });
      } catch (error) {
        console.error("❌ Erreur pour démarrer le timer :", error);
      }
    }
  };    
  
  ///////
  
  useEffect(() => {
    // Réinitialiser hasCardFlipped à false à chaque nouveau tour
    setHasCardFlipped(false);
  }, [currentTurnPlayerId]);

  // Si le jeu n'est pas commencé ou questions en cours de chargement
  if (loading) return <div>Chargement des questions...</div>;
  if (!gameStarted) return <div>Le jeu n'a pas encore commencé.</div>;

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
    </div>
  );
};

export default QuestionGrid;
