const PlayerInfo = ({ pseudo, onLogout, theme }) => {
  console.log('Theme dans PlayerInfo:', theme);  // Vérifie l'état du thème ici

  return (
    <div className='playerInfos'>
      <div className='infos'>
        <div className="infos__pseudo">
          <span>Pseudo du joueur :</span>
          <p>{pseudo}</p>
        </div>
        {theme && theme.name && theme.color ? (
        <div className='infos__theme'>
          <span>Thème sélectionné : </span>
          <p style={{ color: theme.color }}>{theme.name}</p> {/* Affiche le nom du thème avec la couleur */}
        </div>
        ) : (
          <span>Thème en cours de chargement...</span> // Message de chargement
        )}
      </div>
      <button onClick={onLogout}>Déconnexion</button>
    </div>
  );
};

export default PlayerInfo;
