import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase'; // Assure-toi que tu as bien l'instance de Firestore
import { collection, query, where, getDocs, deleteDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Composants
import PlayerInfo from '../components/player/PlayerInfo';
import PlayerList from '../components/player/PlayerList';
import ThemeSelection from '../components/player/ThemeSelection';
import QuestionGrid from '../components/game/Questions/QuestionsGrid';

const Lobby = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams(); // Récupère l'ID de la session depuis l'URL

  const [pseudo, setPseudo] = useState(localStorage.getItem('pseudo'));
  const [playerId, setPlayerId] = useState(localStorage.getItem('playerId'));
  const [players, setPlayers] = useState([]);
  const [themes, setThemes] = useState([]);
  const [playerTheme, setPlayerTheme] = useState(null);
  const [usedThemeIds, setUsedThemeIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // 🛑 Vérifier si le joueur est inscrit, sinon rediriger vers Home
  useEffect(() => {
    const checkIfPlayerExists = async () => {
      if (!playerId) {
        navigate(`/?sessionId=${sessionId}`);
        return;
      }

      const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
      const querySnapshot = await getDocs(playerQuery);

      if (querySnapshot.empty) {
        localStorage.removeItem('playerId');
        localStorage.removeItem('pseudo');
        navigate(`/?sessionId=${sessionId}`);
      } else {
        setIsChecking(false);
      }
    };

    checkIfPlayerExists();
  }, [playerId, sessionId, navigate]);

  //////////////////////////////

  // Charger le thème du localStorage au démarrage
  useEffect(() => {
    const storedTheme = localStorage.getItem('playerTheme');
    if (storedTheme) {
      setPlayerTheme(JSON.parse(storedTheme));
    }
  }, []);

  // Ferme la modal
  const closeThemeSelection = () => {
    setIsModalOpen(false);
  };

  /////////////////////////////////// fonctions pour gérer le thème
  useEffect(() => {
    const checkPlayerTheme = async () => {
      try {
        if (!playerId) return;

        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          const themeId = playerDoc.data().themeId;

          if (themeId) {
            const themeQuery = query(collection(db, 'themes'), where('id', '==', themeId));
            const themeSnapshot = await getDocs(themeQuery);

            if (!themeSnapshot.empty) {
              const themeDoc = themeSnapshot.docs[0];
              const theme = {
                id: themeDoc.id,
                name: themeDoc.data().name,
                color: themeDoc.data().color,
              };
              setPlayerTheme(theme);
              localStorage.setItem('playerTheme', JSON.stringify({ ...theme, playerId }));
            }
          } else {
            setIsModalOpen(true); // 🔥 Toujours ouvrir la modal si le joueur n'a pas de thème
          }
        } else {
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du thème du joueur :', error);
      }
    };

    checkPlayerTheme();
  }, [playerId]);

  const handleThemeUpdate = async (theme) => {
    try {
      // Si un thème était déjà sélectionné, on le retire de la liste des thèmes disponibles
      if (playerTheme) {
        setUsedThemeIds(prev => prev.filter(id => id !== playerTheme.id)); // Retirer l'ancien thème de la liste
      }

      // Mettre à jour le thème du joueur dans Firestore
      if (playerId) {
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const playerDoc = querySnapshot.docs[0];
          const docRef = doc(db, 'players', playerDoc.id); // Utiliser `doc()` pour obtenir la référence

          // Utiliser `updateDoc` avec la référence du document
          await updateDoc(docRef, { themeId: theme.id });  // Mise à jour du thème
        }
      }

      // Mettre à jour localStorage et l'état du thème sélectionné
      setPlayerTheme({
        id: theme.id,
        name: theme.name,
        color: theme.color,
      });
      localStorage.setItem('playerTheme', JSON.stringify(theme));

      // Ajouter immédiatement le thème aux thèmes déjà utilisés
      setUsedThemeIds(prev => [...prev, theme.id]);

      setIsModalOpen(false); // Fermer la modal après sélection

      console.log('Nouveau thème sélectionné:', theme); // Ajoute ceci pour voir si la mise à jour est bien effectuée
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème :', error);
    }
  };

  // Utilisation d'onSnapshot pour écouter en temps réel les thèmes utilisés
  useEffect(() => {
    const playersQuery = query(collection(db, 'players'), where('sessionId', '==', sessionId));

    const unsubscribe = onSnapshot(playersQuery, (querySnapshot) => {
      const playersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPlayers(playersList);

      // 🔥 Mettre à jour la liste des thèmes utilisés en fonction des joueurs connectés
      const usedThemes = playersList
        .map(player => player.themeId)
        .filter(themeId => themeId); // Filtrer les `null` ou `undefined`
      
      setUsedThemeIds(usedThemes);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Utilisation d'onSnapshot pour écouter en temps réel les thèmes disponibles
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'themes'), (querySnapshot) => {
      const themesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setThemes(themesList);
    });

    // Nettoyer l'abonnement quand le composant est démonté
    return () => unsubscribe();
  }, []);

  // Charger la liste des joueurs
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

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      if (playerId) {
        const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
        const querySnapshot = await getDocs(playerQuery);

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await deleteDoc(docRef);
          console.log('Joueur supprimé avec succès');
        }
      }

      // Supprimer les données du localStorage et rediriger
      localStorage.removeItem('sessionId');
      localStorage.removeItem('pseudo');
      localStorage.removeItem('playerId');
      localStorage.removeItem('playerTheme'); // Supprimer également le thème
      // Mettre à jour l'état des thèmes utilisés
      const updatedUsedThemes = usedThemeIds.filter(themeId => themeId !== playerTheme?.id);
      setUsedThemeIds(updatedUsedThemes);
    
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  const availableThemes = themes.filter(theme => {
    // Si le thème est utilisé, mais c'est celui du joueur, on l'affiche quand même
    return !usedThemeIds.includes(theme.id) || playerTheme?.id === theme.id;
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Vérifier si tous les joueurs ont un thème et sont prêts
  const startGame = () => {
    // Vérification si tous les joueurs sont prêts ET ont un thème
    const allPlayersReady = players.every(player => player.isReady === true && player.themeId);
  
    if (allPlayersReady) {
      let countdown = 5;
      const countdownInterval = setInterval(() => {
        if (countdown > 0) {
          console.log(countdown);  // Affichage du compte à rebours
          countdown--;
        } else {
          clearInterval(countdownInterval); // Arrêter le compte à rebours
          setGameStarted(true);  // Démarrer effectivement le jeu
        }
      }, 1000);
    } else {
      alert("Tous les joueurs doivent être prêts et avoir choisi un thème !");
    }
  };
  
  return (
    <div className='lobby'>
      <PlayerInfo 
        pseudo={pseudo} 
        onLogout={handleLogout} 
        theme={playerTheme}
        gameStarted={gameStarted}
        onChangeTheme={() => setIsModalOpen(true)} // Ouvrir la modal pour changer de thème
      />
      <PlayerList 
        players={players} 
        sessionId={sessionId}
        onStartGame={startGame} // Passer la fonction pour démarrer le jeu
        gameStarted={gameStarted}
      />
      <ThemeSelection 
        isOpen={isModalOpen} 
        onClose={closeThemeSelection} 
        themes={availableThemes}
        usedThemeIds={usedThemeIds}
        onThemeUpdate={handleThemeUpdate}
      />
      {gameStarted && 
      <QuestionGrid 
        themes={themes} 
      />
      }
    </div>
  );
};

export default Lobby;
