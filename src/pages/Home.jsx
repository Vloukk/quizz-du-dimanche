import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [pseudo, setPseudo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('/api/games/join-lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pseudo }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        // Stocker le pseudo dans sessionStorage
        sessionStorage.setItem('pseudo', pseudo); 
        navigate(`/lobby/${data.gameId}`);
      } else {
        console.error('Erreur lors de l\'ajout au lobby', data.error);
        alert(data.error);  // Afficher l'erreur au joueur (par exemple, si le pseudo est déjà pris)
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du pseudo', error);
    }
  };
  

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Entrez votre pseudo"
        />
        <button type="submit">Rejoindre le lobby</button>
      </form>
    </div>
  );
};

export default Home;
