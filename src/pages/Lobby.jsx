import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Assure-toi que tu as bien l'instance de Firestore
import { collection, query, where, getDocs, deleteDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';

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
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [themes, setThemes] = useState([]); 
  const [playerTheme, setPlayerTheme] = useState(null); 
  const [usedThemeIds, setUsedThemeIds] = useState([]); // Liste des thèmes déjà utilisés

  // Ferme la modal
  const closeThemeSelection = () => {
    setIsModalOpen(false);
  };

  /////////////////////////////////// fonctions pour gerer le theme
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
    const unsubscribe = onSnapshot(collection(db, 'players'), (querySnapshot) => {
      const usedThemes = querySnapshot.docs
        .map(doc => doc.data().themeId)
        .filter(themeId => themeId); // Filtrer les `null` ou `undefined`

      setUsedThemeIds(usedThemes); // Mettre à jour les thèmes utilisés en temps réel
    });

    // Nettoyer l'abonnement quand le composant est démonté
    return () => unsubscribe();
  }, []);

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
      localStorage.removeItem('themeSelected');
      // Mettre à jour l'état des thèmes utilisés
      const updatedUsedThemes = usedThemeIds.filter(themeId => themeId !== playerTheme?.id);
      setUsedThemeIds(updatedUsedThemes);
    
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  const availableThemes = themes.filter(theme => 
    !usedThemeIds.includes(theme.id) || playerTheme?.id === theme.id
  );

  return (
    <div className='lobby'>
      <PlayerInfo 
        pseudo={pseudo} 
        onLogout={handleLogout} 
        theme={playerTheme}
        onChangeTheme={() => setIsModalOpen(true)}
      />
      <PlayerList 
        players={players} 
        sessionId={sessionId}
      />
      <ThemeSelection 
        isOpen={isModalOpen} 
        onClose={closeThemeSelection} 
        themes={availableThemes}
        usedThemeIds={usedThemeIds}
        onThemeUpdate={handleThemeUpdate}
      />
    </div>
  );
};

export default Lobby;
