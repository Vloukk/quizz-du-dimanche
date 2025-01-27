import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Assure-toi que tu as bien l'instance de Firestore
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Composants
import PlayerInfo from '../components/player/PlayerInfo';
import PlayerList from '../components/player/PlayerList';
import ThemeSelection from '../components/player/ThemeSelection';

const Lobby = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId')); 
  const [pseudo, setPseudo] = useState(localStorage.getItem('pseudo'));
  const [playerId, setPlayerId] = useState(localStorage.getItem('playerId')); 
  const [players, setPlayers] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(true); // Ouvrir la modal au début
  const [themes, setThemes] = useState([]);
  const [playerTheme, setPlayerTheme] = useState(null); // Nouveau state pour stocker le thème du joueur

  // Fonction pour fermer la modal après sélection du thème
  const closeThemeSelection = () => {
    setIsModalOpen(false); // Fermer la modal après la sélection du thème
  };

  useEffect(() => {
    console.log('Player ID dans Lobby:', playerId);
    if (!sessionId) {
      navigate('/'); // Si le sessionId est absent, rediriger vers la page d'accueil
    }
  }, [sessionId, navigate]);

  // Charger le thème du joueur depuis Firestore
  useEffect(() => {
    const fetchPlayerTheme = async () => {
      try {
        if (playerId) {
          const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
          const querySnapshot = await getDocs(playerQuery);

          if (!querySnapshot.empty) {
            const playerDoc = querySnapshot.docs[0]; // Le joueur correspondant
            const themeId = playerDoc.data().themeId; // Récupérer l'ID du thème

            // Ensuite, récupérer les détails du thème à partir de l'ID du thème
            const themeQuery = query(collection(db, 'themes'), where('id', '==', themeId));
            const themeSnapshot = await getDocs(themeQuery);

            if (!themeSnapshot.empty) {
              const themeDoc = themeSnapshot.docs[0];
              setPlayerTheme({
                name: themeDoc.data().name, // Nom du thème
                color: themeDoc.data().color, // Couleur du thème
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du thème du joueur:', error);
      }
    };

    fetchPlayerTheme();
  }, [playerId]); // Recharger le thème chaque fois que le playerId change

  // Fonction pour la déconnexion
  const handleLogout = async () => {
    try {
      const playerId = localStorage.getItem('playerId');

      if (playerId) {
        // Trouver et supprimer le joueur de Firestore
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref; // Accéder à la référence du document
          await deleteDoc(docRef); // Supprimer le joueur de Firestore
          console.log('Joueur supprimé avec succès');
        }
      }

      // Supprimer du localStorage et rediriger
      localStorage.removeItem('sessionId');
      localStorage.removeItem('pseudo');
      localStorage.removeItem('playerId');
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  const handleThemeUpdate = (theme) => {
    setPlayerTheme({
      name: theme.name,  // Nom du thème
      color: theme.color, // Couleur du thème
    });
  };

  // Charger les thèmes depuis Firestore
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'themes'));
        const themesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setThemes(themesList); // Mettre à jour l'état avec les thèmes récupérés
      } catch (error) {
        console.error('Erreur lors de la récupération des thèmes :', error);
      }
    };

    fetchThemes();
  }, []); // Cette fonction est appelée une seule fois lors du montage du composant

  // Récupérer la liste des joueurs
  useEffect(() => {
    const fetchPlayers = async () => {
      const playersQuery = query(collection(db, 'players'), where('sessionId', '==', sessionId));
      const querySnapshot = await getDocs(playersQuery);
      const playersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(playersList);
    };

    fetchPlayers();
  }, [sessionId]);

  return (
    <div className='lobby'>
      <PlayerInfo 
        pseudo={pseudo} 
        onLogout={handleLogout} 
        theme={playerTheme}
      />
      <PlayerList 
        players={players} 
        sessionId={sessionId}
      />
      <ThemeSelection 
        isOpen={isModalOpen} 
        onClose={closeThemeSelection} 
        themes={themes} 
        onThemeUpdate={handleThemeUpdate}
      />
    </div>
  );
};

export default Lobby;
