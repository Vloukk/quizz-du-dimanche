import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlSessionId = queryParams.get('sessionId'); // Récupère sessionId depuis l'URL

  const [pseudo, setPseudo] = useState('');
  const [sessionIdInput, setSessionIdInput] = useState(urlSessionId || '');
  const [isJoiningFromLink, setIsJoiningFromLink] = useState(!!urlSessionId); // Vérifie si l'on rejoint via un lien
  const [errorMessage, setErrorMessage] = useState(''); // State pour afficher les messages d'erreur

  useEffect(() => {
    const storedPseudo = localStorage.getItem('pseudo');
    if (storedPseudo) {
      navigate(`/lobby/${localStorage.getItem('sessionId')}`);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que sessionIdInput est rempli si on ne rejoint pas via un lien
    if (!isJoiningFromLink && !sessionIdInput) {
      setErrorMessage('Ce champ est obligatoire !');
      return; // Empêche la soumission du formulaire si sessionId est vide
    }

    const sessionId = sessionIdInput || localStorage.getItem('sessionId') || uuidv4();
    const playerId = uuidv4();

    try {
      await addDoc(collection(db, "players"), {
        pseudo: pseudo,
        playerId: playerId,
        createdAt: new Date(),
        sessionId: sessionId,
        themeId: null,
        themeColor: null,
      });

      localStorage.setItem('pseudo', pseudo);
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('playerId', playerId);

      navigate(`/lobby/${sessionId}`);
    } catch (error) {
      console.error("Erreur lors de l'ajout du joueur :", error);
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <section className="home">
      <div className="home__logo">
        <img src="/logo-quizz.svg" alt="" />
      </div>
      <div className="home__form">
        {!localStorage.getItem('pseudo') && (
          <form onSubmit={handleSubmit}>
            <div className="form__pseudo">
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Entrez votre pseudo ..."
              />
              {errorMessage && <p className='error'>{errorMessage}</p>}
            </div>
            <div className="form__session">
              {!isJoiningFromLink && ( // Masquer le champ sessionId si l'utilisateur rejoint via un lien
                <div>
                  <input
                    type="text"
                    value={sessionIdInput}
                    onChange={(e) => setSessionIdInput(e.target.value)}
                    placeholder="Entrez un sessionId ..."
                  />
                  {errorMessage && <p className='error'>{errorMessage}</p>} {/* Affichage du message d'erreur */}
                </div>
              )}
            </div>
            <button className='go' type="submit">Let's gooo !</button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Home;
