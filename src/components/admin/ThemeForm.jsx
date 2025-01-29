import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const ThemeForm = ({ themeToEdit, onCancel, onSave }) => {
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColor, setNewThemeColor] = useState('');
  
  // Initialiser avec 10 questions par défaut
  const [newThemeQuestions, setNewThemeQuestions] = useState(
    Array.from({ length: 10 }, (_, index) => ({
      question: `Question ${index + 1}`,
      timeLimit: 30, // Temps par défaut
      correctAnswer: ''
    }))
  );

  useEffect(() => {
    if (themeToEdit) {
      setNewThemeName(themeToEdit.name);
      setNewThemeColor(themeToEdit.color);
      setNewThemeQuestions(themeToEdit.questions);
    }
  }, [themeToEdit]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...newThemeQuestions];
    updatedQuestions[index][field] = value;
    setNewThemeQuestions(updatedQuestions);
  };

  const handleSaveTheme = async (event) => {
    event.preventDefault();

    // Valider que tous les champs sont remplis
    if (
      newThemeName.trim() &&
      newThemeColor.trim() &&
      newThemeQuestions.every(
        (q) =>
          q.question.trim() &&
          q.timeLimit > 0 &&
          q.correctAnswer.trim()
      )
    ) {
      const newTheme = {
        name: newThemeName,
        color: newThemeColor,
        questions: newThemeQuestions,
      };

      try {
        if (themeToEdit) {
          const themeRef = doc(db, 'themes', themeToEdit.id);
          await updateDoc(themeRef, newTheme); // Modifier le thème existant
        } else {
          const themeRef = collection(db, 'themes');
          await addDoc(themeRef, newTheme); // Ajouter un nouveau thème
        }
        onSave(); // Recharger les thèmes après ajout ou modification
        onCancel(); // Annuler le formulaire
      } catch (error) {
        console.error('Erreur lors de l’ajout ou modification du thème :', error);
      }
    } else {
      alert('Veuillez remplir tous les champs.');
    }
  };

  return (
    <form onSubmit={handleSaveTheme} className='themeForm'>
        <h2>{themeToEdit ? 'Modifier le Thème' : 'Ajouter un Nouveau Thème'}</h2>
        <div className="themeForm__info">
          <input
            className='text'
            type="text"
            placeholder="Nom du thème"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            required
          />
          <input
            className='color'
            type="color"
            value={newThemeColor}
            onChange={(e) => setNewThemeColor(e.target.value)}
            required
          />
        </div>
        <div className="themeForm__title">
            <span>Questions</span>
            <span>Temps (s)</span>
            <span>Réponses</span>
        </div>
        {/* Affichage des 10 questions */}
        {newThemeQuestions.map((question, index) => (
          <div key={index} className='themeForm__list'>
            <input
              type="text"
              placeholder={`Question ${index + 1}`}
              value={question.question}
              onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Temps imparti (en secondes)"
              value={question.timeLimit}
              onChange={(e) => handleQuestionChange(index, 'timeLimit', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Réponse correcte"
              value={question.correctAnswer}
              onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
              required
            />
          </div>
        ))}
        <div className="themeForm__btn">
          <button type="submit" disabled={!(newThemeName && newThemeColor && newThemeQuestions.every(q => q.question && q.timeLimit && q.correctAnswer))}>
            {themeToEdit ? 'Mettre à Jour' : 'Ajouter'}
          </button>
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
        </div>
    </form>
  );
};

export default ThemeForm;
