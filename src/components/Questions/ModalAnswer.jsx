import { useEffect, useState, useRef } from "react";
import { collection, doc, onSnapshot, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

const ModalAnswer = ({
  isOpen,
  onNextTurn,
  playerId,
  currentTurnPlayerId,
  currentPlayerThemeColor,
  currentPlayerThemeId,
  isTimerRunning,
  onTimerStateChange,
  sessionId,
}) => {
  const [answer, setAnswer] = useState("");
  const [remainingTime, setRemainingTime] = useState(30);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const timerRef = useRef(null);

  // Réinitialiser la question et la réponse lorsque le tour change
  useEffect(() => {
    setCurrentQuestion(null);  // Réinitialisation de la question
    setAnswer(""); // Réinitialisation de la réponse
    setIsTimeUp(false); // Réinitialisation du temps écoulé
    setHasAnswered(false); // Réinitialisation de l'état de réponse
  }, [currentTurnPlayerId]); // Ces effets se produisent uniquement lorsque le tour change

  // Abonnement à la mise à jour du jeu pour récupérer les infos en temps réel
  useEffect(() => {
    const gameRef = doc(db, "games", sessionId);
    const unsubscribe = onSnapshot(gameRef, (gameSnapshot) => {
      const gameData = gameSnapshot.data();
      console.log("🔹 Données du jeu récupérées :", gameData); // Log pour vérifier la structure des données du jeu
      
      if (gameData?.selectedQuestion) {
        setCurrentQuestion(gameData.selectedQuestion);
        console.log("🔹 Question récupérée :", gameData.selectedQuestion); // Log pour vérifier la question récupérée
      } else {
        console.log("❌ Aucune question sélectionnée pour le moment.");
      }
      
      if (gameData?.timer !== undefined) {
        setRemainingTime(gameData.timer);
      }
      if (gameData?.isTimerRunning !== undefined) {
        onTimerStateChange(gameData.isTimerRunning);
      }
      if (gameData?.flippedCards) {
        setFlippedCards(gameData.flippedCards);
      }
    });
  
    return () => unsubscribe();
  }, [sessionId]);
  

  // Gestion du timer
  useEffect(() => {
    if (isTimerRunning && remainingTime > 0 && currentQuestion) {
      // Nettoyage de l'ancien intervalle pour éviter des exécutions multiples
      if (timerRef.current) clearInterval(timerRef.current);
  
      timerRef.current = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current); // Arrêter le timer une fois le temps écoulé
            setIsTimeUp(true);
            onTimerStateChange(false);
            if (!hasAnswered) {
              setTimeout(() => onNextTurn(), 500); // Tour suivant après une pause
            }
            return 0;
          }
          return prevTime - 1; // Décrémenter le temps restant
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current); // Arrêter le timer si le temps est écoulé ou s'il n'est pas en cours
    }
  
    return () => clearInterval(timerRef.current); // Nettoyer l'intervalle à la fin
  }, [isTimerRunning, remainingTime, currentQuestion, hasAnswered, onNextTurn]);
    

  // Gestion de la soumission de la réponse
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) {
      console.error("❌ Aucune question en cours !");
      return;
    }
  
    if (!currentTurnPlayerId) {
      console.error("❌ currentTurnPlayerId est indéfini !");
      return;
    }
  
    const normalizedAnswer = answer.trim().toLowerCase();
    
    // Vérifier si la réponse donnée correspond à une des bonnes réponses
    const isCorrect = currentQuestion.correctAnswers.some((correctAnswer) => 
      correctAnswer.toLowerCase() === normalizedAnswer
    );
  
    if (!isCorrect) {
      console.log("❌ Mauvaise réponse, annulation !");
      setAnswer(""); // Réinitialiser la réponse
      return;
    }
  
    setHasAnswered(true);
    
    const basePoints = currentQuestion.themeId === currentPlayerThemeId ? 10 : 20;
    const totalPoints = basePoints + remainingTime;
  
    console.log("🔹 Points à ajouter:", totalPoints);
  
    try {
      const playersRef = collection(db, "players");
      const q = query(playersRef, where("playerId", "==", currentTurnPlayerId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.error("❌ Aucun joueur trouvé avec playerId :", currentTurnPlayerId);
        return;
      }
  
      querySnapshot.forEach((doc) => {
        console.log("➡️ Joueur trouvé :", doc.id, "=>", doc.data());
      });
  
      const playerDoc = querySnapshot.docs[0];
      const playerData = playerDoc.data();
      const currentPoints = playerData?.points || 0;
  
      await updateDoc(playerDoc.ref, { points: currentPoints + totalPoints });
  
      console.log("✅ Points mis à jour avec succès !");
      setTimeout(() => onNextTurn(), 500); // Passer au tour suivant après une pause
    } catch (error) {
      console.error("🔥 Erreur Firestore :", error);
    }
  };    

  return (
    <div
      className={`answerModal ${isOpen ? "open" : "closed"}`}
      style={{
        borderColor: currentPlayerThemeColor || "#131313",
        borderWidth: "1px",
        borderStyle: "solid",
        boxShadow: `0 0 2px 2px ${currentPlayerThemeColor}` || "#00000",
      }}
    >
      <div className="answerModal__question">
        <h2>{currentQuestion ? currentQuestion.question : "Aucune question disponible"}</h2>
      </div>
      {playerId === currentTurnPlayerId && (
        <div className="answerModal__reponse">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tapez votre réponse ici..."
            disabled={isTimeUp}
          />
          <button onClick={handleSubmitAnswer} disabled={isTimeUp || !answer.trim()}>
            Valider
          </button>
        </div>
      )}
      <div className="answerModal__time">
        {isTimerRunning && <p>{remainingTime} secondes</p>}
        {!isTimerRunning && isTimeUp && !hasAnswered && <p>Le temps est écoulé, tour suivant !</p>}
      </div>
    </div>
  );
};

export default ModalAnswer;
