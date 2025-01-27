import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase'; // Assurez-vous que vous avez bien l'instance de Firestore
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Générer un ID unique pour le joueur

// Fonction pour ajouter un joueur dans Firestore
const addPlayer = async (pseudo, playerId, sessionId) => {
  try {
    const playerData = {
      pseudo: pseudo,
      playerId: playerId, // ID que vous avez généré manuellement
      createdAt: new Date(),
      sessionId: sessionId, // Ajouter le sessionId pour lier ce joueur à la session
      themeId: null, // Par défaut, le joueur n'a pas encore choisi de thème
      themeColor: null, // Par défaut, il n'a pas encore de couleur de thème
    };

    // Ajouter le document à la collection 'players'
    const docRef = await addDoc(collection(db, "players"), playerData);
    console.log("Nouveau joueur ajouté avec ID : ", docRef.id); // ID généré automatiquement pour le document

    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du joueur :", error);
  }
};

const Home = () => {
  const [pseudo, setPseudo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pseudo) {
      alert('Veuillez entrer un pseudo.');
      return;
    }

    // Récupérer ou générer un sessionId
    const sessionId = localStorage.getItem('sessionId') || uuidv4();
    const playerId = uuidv4(); // Génère un ID unique pour ce joueur

    console.log("ID généré pour le joueur:", playerId);

    // Ajouter le joueur à Firestore avec son pseudo et playerId
    await addPlayer(pseudo, playerId, sessionId);

    // Stocker le pseudo, sessionId et playerId dans localStorage avant de naviguer
    localStorage.setItem('pseudo', pseudo);
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('playerId', playerId);

    // Naviguer vers le lobby avec l'ID de la session
    navigate(`/lobby/${sessionId}`);
  };

  return (
    <section className="home">
     <Link to="/admin">Login</Link>
      <div className="home__form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Entrez votre pseudo ..."
          />
          <button type="submit">Let's gooo !</button>
        </form>
      </div>
    </section>
  );
};

export default Home;
