import { useState, useEffect } from 'react';

const QuestionModal = ({ isOpen, questionData, onClose, onAnswer, timeLimit }) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isAnswered, setIsAnswered] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === 0) {
          clearInterval(timer);
          handleAnswer();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleAnswer = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    const correct = answer === questionData.answer;
    onAnswer(correct);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAnswer();
  };

  if (!isOpen) return null;

  return (
    <div className="question-modal">
      <div className="modal-content">
        <h2>Question</h2>
        <p>{questionData.question}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Entrez votre réponse"
            disabled={isAnswered}
          />
          <button type="submit" disabled={isAnswered}>
            Soumettre
          </button>
        </form>
        <div className="timer">
          <p>Temps restant: {timeLeft}s</p>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
