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
              Chaque question doit avoir une ou plusieurs bonnes réponses. Les réponses possibles doivent être basées uniquement sur des variations d'orthographe, des formulations courantes, des abréviations, ou des titres simplifiés. Si une seule réponse correcte existe, n'ajoute pas de réponses supplémentaires. Ne rajoute pas de variantes inutiles, ne dupplique pas les réponses, et surtout pour des titres de films ou des termes précis.
            
              Par exemple :
              1. Question : Quel est le président des États-Unis en 2025 ?
                 Réponses possibles : Joe Biden, Biden, Joseph R. Biden
              
              2. Question : Quel est l'élément chimique dont le symbole est "O" ?
                 Réponses possibles : Oxygène, Dioxygène, O2
              
              3. Question : Quelle est la capitale de la France ?
                 Réponses possibles : Paris
              
              4. Question : Quelle est la couleur du ciel lors d'une journée ensoleillée ?
                 Réponses possibles : Bleu
              
              5. Question : Qui a peint la Mona Lisa ?
                 Réponses possibles : Léonard de Vinci, Vinci
              
              6. Question : Quel est le titre du film de science-fiction sorti en 1977, réalisé par George Lucas, avec les personnages de Luke Skywalker et Dark Vador ?
                 Réponses possibles : Star Wars, Guerre des étoiles
              
              7. Question : Quel est le titre du film de 1980 avec les personnages de Han Solo, Leia, et Luke Skywalker dans l'univers de Star Wars ?
                 Réponses possibles : L'Empire contre-attaque, Star Wars épisode V, star wars
              
              8. Question : Qui a réalisé le film Titanic sorti en 1997 ?
                 Réponses possibles : James Cameron
              
              9. Question : Quel film a remporté l'Oscar du meilleur film en 1994 ?
                 Réponses possibles : Forrest Gump
              
              10. Question : Quel est le nom du personnage principal du film "Le Seigneur des Anneaux" ?
                  Réponses possibles : Frodon, Frodon Sacquet
              
              Les réponses doivent être exactes et basées sur des faits vérifiables. Ne génère pas de réponses incorrectes ou de variantes qui ne sont pas courantes. Limite les réponses alternatives à des variations d'orthographe ou des simplifications des titres (ex. "Star Wars" au lieu de "Star Wars épisode IV : Un nouvel espoir", ou "Le Retour du Jedi" au lieu de "Star Wars épisode VI : Le Retour du Jedi").
            
              Formate les résultats sous forme de question suivie des réponses possibles.
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

  ////

  const handleAnswerChange = (questionIndex, answerIndex, newAnswer) => {
    const updatedQuestions = [...newThemeQuestions];
    updatedQuestions[questionIndex].correctAnswers[answerIndex] = newAnswer;
    setNewThemeQuestions(updatedQuestions);
  };
  
  // Fonction pour parser la réponse de GPT et extraire les questions/réponses
  const parseGPTResponse = (text) => {
    const lines = text.split("\n").filter(line => line.includes(":"));
    const questions = [];
  
    for (let i = 0; i < lines.length; i += 2) {
      const questionLine = lines[i]?.trim();
      const answerLine = lines[i + 1]?.trim();
      
      if (questionLine && answerLine) {
        const questionText = questionLine.replace(/^(\d+\.)\s?Question\s?:\s?/i, '').trim();
        const answerText = answerLine.replace(/^Réponses possibles\s?:\s?/i, '').trim();
  
        // Séparer les réponses alternatives
        const answers = answerText.split(',').map(ans => ans.trim());
  
        questions.push({
          question: questionText,
          timeLimit: 30,
          correctAnswers: answers, // Stocker toutes les réponses possibles
        });
      }
    }
  
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

      <span className='separator'></span>

      <div className="themeForm__title">
        <span>Questions</span>
        <span>Temps (s)</span>
        <span>Réponses</span>
      </div>

      {newThemeQuestions.map((q, index) => (
  <div key={index} className='themeForm__list'>
    <input
      type="text"
      placeholder={`Question ${index + 1}`}
      value={q.question}
      readOnly
      required
    />
    <input
      type="number"
      value={q.timeLimit}
      onChange={(e) => handleQuestionChange(index, 'timeLimit', e.target.value)}
      required
    />
    {showAnswers ? (
      <ul className='answer__list'>
        {q.correctAnswers.map((answer, answerIndex) => (
          <li>
            <input
              key={answerIndex}
              type="text"
              placeholder={`Réponse alternative ${answerIndex + 1}`}
              value={answer}
              onChange={(e) => handleAnswerChange(index, answerIndex, e.target.value)}
              required
            />
          </li>
        ))}
      </ul>
    ) : (
      <input
        type="text"
        placeholder="Réponse correcte"
        value="Réponse cachée"
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
