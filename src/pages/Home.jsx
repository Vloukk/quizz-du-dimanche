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

  useEffect(() => {
    const storedPseudo = localStorage.getItem('pseudo');
    if (storedPseudo) {
      navigate(`/lobby/${localStorage.getItem('sessionId')}`);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pseudo) {
      alert('Veuillez entrer un pseudo.');
      return;
    }

    const sessionId = sessionIdInput || localStorage.getItem('sessionId') || uuidv4();
    const playerId = uuidv4();

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
  };

  return (
    <section className="home">
      <div className="home__form">
        {!localStorage.getItem('pseudo') && (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Entrez votre pseudo ..."
            />
            {!isJoiningFromLink && ( // Masquer le champ sessionId si l'utilisateur rejoint via un lien
              <input
                type="text"
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                placeholder="Entrez un sessionId ..."
              />
            )}
            <button type="submit">Let's gooo !</button>
          </form>
        )}
      </div>
    </section>
  );
};

export default Home;
