import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event) => {
    event.preventDefault(); // Empêcher le rechargement de la page lors de la soumission du formulaire

    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD; // Récupère le mot de passe depuis .env

    if (password === correctPassword) {
      localStorage.setItem('isAdmin', 'true'); // Définit isAdmin dans le localStorage
      navigate('/admin-page'); // Redirige vers la page admin
    } else {
      setError('Mot de passe incorrect'); // Affiche un message d'erreur si le mot de passe est incorrect
    }
  };

  return (
    <div className="adminLogin">
      <h2>Connexion Admin</h2>
      <form className="adminLogin__form" onSubmit={handleLogin}>
        <input
          type="password"
          placeholder="Entrez le mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password" // Ajout pour éviter les avertissements liés au champ mot de passe
        />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p className="error">{error}</p>} {/* Affiche un message d'erreur si nécessaire */}
    </div>
  );
};

export default AdminLogin;

