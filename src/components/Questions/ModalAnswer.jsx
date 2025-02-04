import React, { useState, useEffect } from "react";

const ModalAnswer = ({
  isOpen,
  question,
  onNextTurn,
  playerId,
  currentTurnPlayerId,
  currentPlayerThemeColor, // Ajout de la prop pour la couleur du thème
}) => {
  const [answer, setAnswer] = useState(""); // Réponse de l'utilisateur
  const [remainingTime, setRemainingTime] = useState(question?.time || 30); // Assurer une valeur par défaut
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false); // Statut de la réponse
  const [isTimeUp, setIsTimeUp] = useState(false); // Si le temps est écoulé
  const [timer, setTimer] = useState(null); // Gère l'ID du timer
  const [hasAnswered, setHasAnswered] = useState(false);

  // Logique pour le timer
  useEffect(() => {
    if (!question || !isOpen || playerId !== currentTurnPlayerId || hasAnswered) return;
  
    console.log("Début du timer pour la question :", question.question);
  
    setRemainingTime(question.time || 30);
    setIsAnswerCorrect(false);
    setIsTimeUp(false);
    setAnswer("");
  
    const newTimer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(newTimer);
          setIsTimeUp(true);
          if (!isAnswerCorrect) {
            onNextTurn();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    setTimer(newTimer);
  
    return () => {
      console.log("Arrêt du timer !");
      clearInterval(newTimer);
    };
  }, [question, isOpen, playerId, currentTurnPlayerId, onNextTurn, isAnswerCorrect, hasAnswered]);

  ////

  const checkAnswer = (answer) => {
    return answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  };

  /////

  const handleSubmitAnswer = () => {
    const isCorrect = checkAnswer(answer);
    if (isCorrect) {
      setIsAnswerCorrect(true);
      setHasAnswered(true); // Empêche le redémarrage du timer
      onNextTurn();
    } else {
      setAnswer("");
    }
  };

  return (
    <div 
      className={`answerModal ${isOpen ? "open" : "closed"}`} 
      style={{ 
        borderColor: currentPlayerThemeColor || "#131313", // La bordure prend la couleur du thème du joueur actif
        borderWidth: '1px',         // Choisir la taille de la bordure
        borderStyle: 'solid',       // Style de la bordure (plein)
        boxShadow: `0 0 8px 1px ${currentPlayerThemeColor}` || "#00000",
      }}
    >
      <div className="answerModal__question">
        <h2>{question ? question.question : "Aucune question disponible"}</h2>
      </div>
      <div className="answerModal__reponse">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Tapez votre réponse ici..."
          disabled={isTimeUp} // Désactive la saisie si le temps est écoulé
        />
        <button
          onClick={handleSubmitAnswer}
          disabled={isTimeUp || !answer.trim()} // Désactive le bouton si le temps est écoulé ou si la réponse est vide
        >
          Valider
        </button>
      </div>
      <div className="answerModal__time">
        <p>{remainingTime} secondes</p>
        {isTimeUp && !isAnswerCorrect && <p>Le temps est écoulé, tour suivant !</p>}
      </div>
    </div>
  );
};

export default ModalAnswer;
