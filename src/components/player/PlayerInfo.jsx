import { useEffect } from 'react';

const PlayerInfo = ({ pseudo, onLogout, theme, onChangeTheme, gameStarted }) => {
  
  return (
    <div className='playerInfos'>
      <div className="playerInfos__container">
        <div className="container__logo">
          <img src="/logo-quizz.svg" alt="logo" />
          <p>{pseudo}</p>
        </div>
        <div className='container__infos'>
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
        <div className="container__btn">
          <button 
            className='change-theme'
            onClick={onChangeTheme} 
            disabled={gameStarted}  // Désactive le bouton si le jeu a démarré
          >
            Changer de Thème
          </button>
          <button className='deco' onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
