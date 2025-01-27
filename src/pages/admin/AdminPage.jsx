// AdminPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import ThemeForm from '../../components/admin/ThemeForm'; // Importer le nouveau composant ThemeForm

const AdminPage = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [editingTheme, setEditingTheme] = useState(null); // Gérer l'édition d'un thème

  // Vérifier si l'utilisateur est connecté en tant qu'admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Récupérer les thèmes
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

  // Supprimer un thème
  const handleThemeDelete = async (themeId) => {
    try {
      const themeRef = doc(db, 'themes', themeId);
      await deleteDoc(themeRef); // Supprimer dans Firestore
      setThemes((prevThemes) => prevThemes.filter((theme) => theme.id !== themeId)); // Mettre à jour localement
    } catch (error) {
      console.error('Erreur lors de la suppression du thème :', error);
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingTheme(null);
  };

  return (
    <div className="adminPage">
      <div className="adminPage__themes">
        <ThemeForm themeToEdit={editingTheme} onCancel={handleCancelEdit} onSave={fetchThemes} />
        <ul className='themes__list'>
          <h2>Liste des Thèmes</h2>
          {themes.length === 0 ? (
            <p>Aucun thème trouvé.</p>
          ) : (
            themes.map((theme) => (
              <li key={theme.id}>
                <div className='themeCard' style={{ backgroundColor: theme.color, padding: '10px', margin: '5px' }}>
                  <div className="themeCard__name">
                    <p>Nom :</p>
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
    </div>
  );
};

export default AdminPage;
