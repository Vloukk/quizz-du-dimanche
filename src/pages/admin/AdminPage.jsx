import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import ThemeForm from '../../components/admin/ThemeForm';
import PlayersModal from './PlayerModal';
import gsap from 'gsap';

const AdminPage = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [editingTheme, setEditingTheme] = useState(null);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const modalRef = useRef(null); // Ref pour la modal

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  const fetchThemes = async () => {
    try {
      const themesSnapshot = await getDocs(collection(db, 'themes'));
      const themesList = themesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setThemes(themesList);
    } catch (error) {
      console.error('Erreur lors de la récupération des thèmes :', error);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleThemeDelete = async (themeId) => {
    try {
      await deleteDoc(doc(db, 'themes', themeId));
      setThemes((prevThemes) => prevThemes.filter((theme) => theme.id !== themeId));
    } catch (error) {
      console.error('Erreur lors de la suppression du thème :', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTheme(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  // Fonction pour fermer la modal avec l’animation GSAP
  const closeModalWithAnimation = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        x: "-100%", // Cache vers la gauche
        duration: 0.5,
        ease: "power3.in",
        onComplete: () => {
          setIsPlayersModalOpen(false);
        },
      });
    }
  };

  return (
    <div className="adminPage">
      <div className="adminPage__header">
        <button 
          onClick={() => {
            if (isPlayersModalOpen) {
              closeModalWithAnimation();
            } else {
              setIsPlayersModalOpen(true);
            }
          }} 
          className="playersBtn"
        >
          {isPlayersModalOpen ? "Fermer" : "Voir les joueurs"}
        </button>

        <button onClick={handleLogout} className="logoutBtn">
          Se Déconnecter
        </button>
      </div>

      <div className="adminPage__themes">
        <ThemeForm themeToEdit={editingTheme} onCancel={handleCancelEdit} onSave={fetchThemes} />
        <ul className="themes__list">
          <h2>Liste des Thèmes</h2>
          {themes.length === 0 ? (
            <p>Aucun thème trouvé.</p>
          ) : (
            themes.map((theme) => (
              <li key={theme.id}>
                <div className="themeCard" style={{ backgroundColor: theme.color, padding: '10px', margin: '5px' }}>
                  <div className="themeCard__name">
                    <h3>{theme.name}</h3>
                  </div>
                  <div className="themeCard__buttons">
                    <button onClick={() => setEditingTheme(theme)}>Modifier</button>
                    <button onClick={() => handleThemeDelete(theme.id)}>Supprimer</button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      
      <PlayersModal 
        isOpen={isPlayersModalOpen} 
        onClose={() => setIsPlayersModalOpen(false)} 
        modalRef={modalRef} // On passe la ref ici
      />
    </div>
  );
};

export default AdminPage;
