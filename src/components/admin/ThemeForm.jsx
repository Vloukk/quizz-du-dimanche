import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const ThemeForm = ({ themeToEdit, onCancel, onSave }) => {
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColor, setNewThemeColor] = useState('');
  const [newThemeQuestions, setNewThemeQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('moyenne'); // Difficulté sélectionnée : "facile", "moyenne", "difficile"
  const [showAnswers, setShowAnswers] = useState(false); // État global pour afficher/masquer toutes les réponses

  useEffect(() => {
    if (themeToEdit) {
      setNewThemeName(themeToEdit.name);
      setNewThemeColor(themeToEdit.color);
      setNewThemeQuestions(themeToEdit.questions);
    }
  }, [themeToEdit]);

  // Fonction pour récupérer les questions GPT avec la difficulté choisie
  const fetchGPTQuestions = async (attempt = 1) => {
    const maxRetries = 5; // Nombre maximal de tentatives
    const backoffDelay = Math.pow(2, attempt) * 1000; // Délai exponentiel (double à chaque tentative)
  
    try {
      const difficultyPrompts = {
        facile: "Génère des questions de quiz faciles avec des réponses simples et correctes.",
        moyenne: "Génère des questions de quiz moyennement difficiles avec des réponses détaillées et exactes.",
        difficile: "Génère des questions de quiz très difficiles avec des concepts complexes et des réponses détaillées, exactes et vérifiables.",
      };
  
      const promptContent = difficultyPrompts[difficulty] || difficultyPrompts['moyenne'];
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Tu es un assistant qui génère des questions de quiz avec des réponses précises et vérifiables, sur un thème donné. Les réponses doivent être exactes et concises." },
            {
              role: "user", content: `
              Génère 10 questions de quiz en rapport avec le thème "${newThemeName}". 
              Le niveau de difficulté est ${difficulty}. 
              Chaque question doit avoir une seule bonne réponse. 
              La réponse doit être correcte, basée sur des faits vérifiables, sans générer de réponses approximatives ou fausses.
              Formate les résultats sous forme de question suivie de sa réponse. Par exemple :
              1. Question : Quel est le nom de la déesse protectrice des Eniripsas dans Dofus ?
                 Réponse : Eniripsa
              ` 
            }
          ],
          temperature: 0.5, // Réduire la température pour moins de diversité et plus de précision
        }),
      });
  
      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          console.log(`Rate limit atteint. Tentative dans ${backoffDelay / 1000} secondes.`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay)); // Attendre avant de réessayer
          return fetchGPTQuestions(attempt + 1); // Nouvelle tentative avec un délai plus long
        }
        const errorData = await response.json();
        throw new Error(`Erreur OpenAI: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
  
      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;
  
      console.log("Réponse de l'API :", generatedText);  // Affiche la réponse brute de l'API dans la console
  
      if (!generatedText) {
        throw new Error("Aucune question générée.");
      }
  
      const questions = parseGPTResponse(generatedText);
      setNewThemeQuestions(questions);
    } catch (error) {
      console.error("Erreur lors de la génération :", error);
      alert(`Erreur lors de la génération : ${error.message}`);
    }
  };
  
  // Fonction pour parser la réponse de GPT et extraire les questions/réponses
  const parseGPTResponse = (text) => {
    const lines = text.split("\n").filter(line => line.includes(":"));
    console.log("Lignes extraites de la réponse :", lines);  // Affiche les lignes extraites dans la console
  
    const questions = [];
    
    // On parcourt les lignes par paires : question puis réponse
    for (let i = 0; i < lines.length; i += 2) {
      const questionLine = lines[i]?.trim();  // La ligne avec la question
      const answerLine = lines[i + 1]?.trim();  // La ligne avec la réponse
      
      // Si nous avons une question et une réponse, on les ajoute au tableau
      if (questionLine && answerLine) {
        const questionText = questionLine.replace(/^(\d+\.)\s?Question\s?:\s?/i, '').trim(); // Nettoie le texte de la question
        const answerText = answerLine.replace(/^Réponse\s?:\s?/i, '').trim(); // Nettoie la réponse
        
        questions.push({
          question: questionText,
          timeLimit: 30,
          correctAnswer: answerText,
        });
      }
    }
  
    console.log("Questions extraites : ", questions);  // Affiche les questions extraites dans la console
    return questions;
  };

  const handleSaveTheme = async (event) => {
    event.preventDefault();

    if (!newThemeName.trim() || !newThemeColor.trim() || newThemeQuestions.length === 0) {
      alert('Veuillez remplir tous les champs et générer les questions.');
      return;
    }

    const newTheme = {
      name: newThemeName,
      color: newThemeColor,
      questions: newThemeQuestions,
    };

    try {
      if (themeToEdit) {
        const themeRef = doc(db, 'themes', themeToEdit.id);
        await updateDoc(themeRef, newTheme);
      } else {
        await addDoc(collection(db, 'themes'), newTheme);
      }
      onSave();
      onCancel();
    } catch (error) {
      console.error('Erreur lors de l’ajout ou modification du thème :', error);
    }
  };

  // Fonction pour basculer l'affichage des réponses
  const toggleAllAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  return (
    <form onSubmit={handleSaveTheme} className='themeForm'>
      <h2>{themeToEdit ? 'Modifier le Thème' : 'Ajouter un Nouveau Thème'}</h2>
      <div className="themeForm__info">
        <div className="info__text">
          <input
            type="text"
            className='theme'
            placeholder="Prompt pour le theme ..."
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            required
          />
          <input
            type="color"
            value={newThemeColor}
            onChange={(e) => setNewThemeColor(e.target.value)}
            required
          />
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Choisir la difficulté :</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="facile">Facile</option>
              <option value="moyenne">Moyenne</option>
              <option value="difficile">Difficile</option>
            </select>
          </div>
          <button className='generate' type="button" onClick={fetchGPTQuestions} disabled={loading}>
            {loading ? 'Génération en cours...' : 'Générer les Questions'}
          </button>
        </div>
        <div className='info__answers'>
          <button type="button" onClick={toggleAllAnswers}>
            {showAnswers ? 'Masquer les réponses' : 'Afficher les réponses'}
          </button>
        </div>
      </div>

      <div className="themeForm__title">
        <span>Questions</span>
        <span>Temps (s)</span>
        <span>Réponses</span>
      </div>

      {newThemeQuestions.map((q, index) => (
        <div key={index} className='themeForm__list'>
          {/* Question générée, non modifiable */}
          <input
            type="text"
            placeholder={`Question ${index + 1}`}
            value={q.question}
            readOnly // Rend la question non modifiable
            required
          />
          <input
            type="number"
            value={q.timeLimit}
            onChange={(e) => handleQuestionChange(index, 'timeLimit', e.target.value)}
            required
          />
          {/* Réponse correcte modifiable, affichée selon `showAnswers` */}
          {showAnswers ? (
            <input
              type="text"
              placeholder="Réponse correcte"
              value={q.correctAnswer}
              onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Réponse correcte"
              value=""
              readOnly
            />
          )}
        </div>
      ))}

      <div className="themeForm__btn">
        <button type="submit" disabled={!(newThemeName && newThemeColor && newThemeQuestions.length > 0)}>
          {themeToEdit ? 'Mettre à Jour' : 'Ajouter'}
        </button>
        <button type="button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
};

export default ThemeForm;
