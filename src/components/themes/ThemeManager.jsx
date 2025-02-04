import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const useThemeManager = (playerId, usedThemeIds, onThemeUpdate) => {
  const [playerTheme, setPlayerTheme] = useState(null);

  // Charger le thème du joueur au démarrage
  useEffect(() => {
    const checkPlayerTheme = async () => {
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
            const theme = themeDoc.data();
            setPlayerTheme(theme);
            onThemeUpdate(theme);
          }
        }
      }
    };

    checkPlayerTheme();
  }, [playerId, onThemeUpdate]);

  // Fonction pour gérer la mise à jour du thème
  const handleThemeUpdate = async (theme) => {
    if (playerId) {
      const playerQuery = query(collection(db, 'players'), where('playerId', '==', playerId));
      const querySnapshot = await getDocs(playerQuery);

      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0];
        const docRef = playerDoc.ref;
        await updateDoc(docRef, { themeId: theme.id });

        setPlayerTheme(theme);
        onThemeUpdate(theme);
      }
    }
  };

  return {
    playerTheme,
    handleThemeUpdate,
  };
};

const ThemeManager = ({ playerId, usedThemeIds, onThemeUpdate }) => {
  const { playerTheme, handleThemeUpdate } = useThemeManager(playerId, usedThemeIds, onThemeUpdate);

  return (
    <div>
      {/* Render UI for theme selection and show the current theme */}
      {playerTheme ? <p>Theme: {playerTheme.name}</p> : <p>No theme selected</p>}
      <button onClick={() => handleThemeUpdate(newTheme)}>Select Theme</button>
    </div>
  );
};

export default ThemeManager;
