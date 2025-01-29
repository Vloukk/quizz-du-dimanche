import { useEffect } from 'react';
import { db } from '../../firebase'; // Assurez-vous que vous avez bien l'instance de Firestore
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { gsap } from 'gsap';

const ThemeSelection = ({ isOpen, onClose, themes, usedThemeIds, onThemeUpdate }) => {

  useEffect(() => {
    if (isOpen) {
      // Animer chaque carte de thème lorsque la modal s'ouvre
      gsap.from('.theme-item', {
        y: 120,         // Position de départ
        opacity: 1,     // Rendre invisible au départ
        stagger: 0.1,   // Ajouter un petit délai entre chaque animation
        duration: 0.6,  // Durée de l'animation
        ease: 'power2.inOut', // Facilité d'animation
      });
    }
  }, [isOpen]);

  // Filtrer les thèmes pour ne pas afficher ceux déjà utilisés
  const availableThemes = themes.filter(theme => !usedThemeIds.includes(theme.id));

  const handleThemeSelect = async (theme) => {
    try {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) {
        console.log('Player ID not found');
        return;
      }
  
      const playerQuery = query(
        collection(db, 'players'),
        where('playerId', '==', playerId)
      );
  
      const querySnapshot = await getDocs(playerQuery);
  
      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0]; 
        const playerDocRef = playerDoc.ref;
  
        await updateDoc(playerDocRef, {
          themeId: theme.id,
          themeColor: theme.color,
        });
  
        console.log('Thème sélectionné et mis à jour dans Firestore');
        localStorage.setItem('themeSelected', 'true'); // Marquer le thème comme sélectionné
        onThemeUpdate(theme);
      } else {
        console.log('Aucun joueur trouvé avec cet ID');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
    }
  
    onClose();
  };
  
  if (!isOpen) return null; // Si la modal est fermée, ne rien afficher

  return (
    <div className="modal-overlay">
      <h2>Sélectionner un Thème</h2>
      <div className="modal-content">
        <div className="themes">
          {availableThemes.map((theme) => (
            <div
              key={theme.id}
              className="theme-item"
              style={{ backgroundColor: theme.color }}
              onClick={() => handleThemeSelect(theme)} // Sélection du thème
            >
              <span>{theme.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelection;

