import { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import QuestionCard from './QuestionsCard';

const QuestionGrid = ({ themes }) => {
  const [questions, setQuestions] = useState([]);
  const [columnCount, setColumnCount] = useState(3); // Nombre initial de colonnes

  useEffect(() => {
    const fetchQuestions = async () => {
      const themesCollection = collection(db, 'themes');
      const themesSnapshot = await getDocs(themesCollection);

      let allQuestions = [];

      themesSnapshot.forEach((themeDoc) => {
        const themeData = themeDoc.data();
        const themeColor = themeData.color;

        themeData.questions.forEach((q, index) => {
          allQuestions.push({
            id: `${themeDoc.id}-${index}`,
            question: q.question,
            answer: q.correctAnswer,
            color: themeColor,
          });
        });
      });

      // Mélanger les questions après les avoir récupérées
      const shuffledQuestions = shuffleArray(allQuestions);
      setQuestions(shuffledQuestions);
    };

    fetchQuestions();
  }, []);

  // Fonction de mélange des éléments
  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  // Calculer dynamiquement le nombre de colonnes en fonction du nombre de questions
  useEffect(() => {
    const totalQuestions = questions.length;
    const calculateColumns = () => {
      if (totalQuestions > 20) return 10; // Pour plus de 20 questions, 6 colonnes
      if (totalQuestions > 12) return 4; // Pour plus de 12 questions, 4 colonnes
      return 3; // Pour moins de 12 questions, 3 colonnes
    };

    setColumnCount(calculateColumns());
  }, [questions]);

  return (
    <div
      className="question-grid"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`, // Dynamique en fonction du nombre de colonnes
      }}
    >
      {questions.map((q) => (
        <QuestionCard key={q.id} questionData={q} />
      ))}
    </div>
  );
};

export default QuestionGrid;
