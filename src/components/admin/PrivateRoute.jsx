import React from 'react';
import { Navigate } from 'react-router-dom';

// Fonction de vérification de l'authentification admin
const PrivateRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin'); // Vérifie si l'utilisateur est admin

  console.log('isAdmin:', isAdmin); // Log pour vérifier la valeur de isAdmin dans localStorage

  // Si l'utilisateur est admin, on affiche les enfants (la route protégée)
  if (isAdmin) {
    return children;
  }

  // Sinon, on redirige vers la page de login
  return <Navigate to="/admin" replace />;
};

export default PrivateRoute;


