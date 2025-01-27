import { useState } from 'react';
import { db } from '../../firebase'; // Assurez-vous que vous avez bien l'instance de Firestore
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const ThemeSelection = ({ isOpen, onClose, themes, onThemeUpdate }) => {
  const handleThemeSelect = async (theme) => {
    try {
      const playerId = localStorage.getItem('playerId');
      if (!playerId) {
        console.log('Player ID not found');
        return;
      }

      // Créer la requête pour récupérer le joueur avec le playerId
      const playerQuery = query(
        collection(db, 'players'),
        where('playerId', '==', playerId) // Utilisation de `where` pour filtrer par playerId
      );

      const querySnapshot = await getDocs(playerQuery);

      // Vérification si le joueur existe
      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0]; // Le joueur correspondant
        const playerDocRef = playerDoc.ref; // Référence du document du joueur

        // Mise à jour du thème du joueur
        await updateDoc(playerDocRef, {
          themeId: theme.id,
          themeColor: theme.color, // On peut également stocker la couleur du thème si nécessaire
        });

        console.log('Thème sélectionné et mis à jour dans Firestore');

        // Appeler la fonction de mise à jour pour mettre à jour l'état dans Lobby
        onThemeUpdate(theme);
      } else {
        console.log('Aucun joueur trouvé avec cet ID');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
    }

    // Fermer la modal après la sélection d'un thème
    onClose();
  };

  if (!isOpen) return null; // Si la modal est fermée, ne rien afficher

  return (
    <div className="modal-overlay">
      <h2>Sélectionner un Thème</h2>
      <div className="modal-content">
        <div className="themes">
          {themes.map((theme) => (
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
