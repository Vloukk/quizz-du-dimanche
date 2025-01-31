import { useEffect } from 'react';

const PlayerInfo = ({ pseudo, onLogout, theme, onChangeTheme, gameStarted }) => {
  
  // Utilisation de useEffect pour écouter les changements de thème
  useEffect(() => {
    // Ceci s'exécutera à chaque fois que le `theme` change
    console.log('Le thème a été mis à jour:', theme);
  }, [theme]); // Le `theme` est passé dans le tableau de dépendances pour que le useEffect se déclenche à chaque mise à jour du thème

  return (
    <div className='playerInfos'>
      <div className="playerInfos__logo">
        <img src="/logo-quizz.svg" alt="logo" />
      </div>
      <div className='infos'>
        <div className="infos__pseudo">
          <span>Pseudo du joueur :</span>
          <p>{pseudo}</p>
        </div>
        {theme ? (
          theme.name && theme.color ? (
            <div className='infos__theme'>
              <span>Thème sélectionné :</span>
              <p style={{ color: theme.color }}>{theme.name}</p>
            </div>
          ) : (
            <span>Thème en cours de chargement...</span>
          )
        ) : (
          <span>Aucun thème sélectionné.</span>
        )}
      </div>
      <button 
        onClick={onChangeTheme} 
        disabled={gameStarted}  // Désactive le bouton si le jeu a démarré
      >
        Changer de Thème
      </button>
      <button className='deco' onClick={onLogout}>Déconnexion</button>
    </div>
  );
};

export default PlayerInfo;
