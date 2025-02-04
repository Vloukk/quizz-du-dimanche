import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { db } from '../../firebase'; // Assure-toi que db est bien configuré comme exporté dans firebase.js
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; // Importer les méthodes spécifiques

const QuestionCard = ({ playerId, questionData, onCardClick, disabled, currentTurnPlayerId, gameId, flippedCards }) => {
    const [flipped, setFlipped] = useState(false);
    const [color, setColor] = useState('black');
    const cardRef = useRef(null);

    // Animation et gestion des timeouts
    useEffect(() => {
        gsap.set(cardRef.current, { rotationY: 180 }); // Carte initialement cachée
    
        const colorTimeout = setTimeout(() => {
            setColor(questionData.color); // Applique la couleur après 1 seconde
        }, 1000);
    
        const resetTimeout = setTimeout(() => {
            setColor('black'); // Réinitialise la couleur après 31 secondes
        }, 31000);
    
        // Nettoyage
        return () => {
            clearTimeout(colorTimeout);
            clearTimeout(resetTimeout);
        };
    }, [questionData.color]);
    

    // Fonction pour gérer le clic sur la carte
    const handleClick = async () => {
        if (playerId !== currentTurnPlayerId || disabled || flipped) {
          console.log("Ce n'est pas ton tour, la carte est désactivée, ou elle est déjà retournée !");
          return;
        }
      
        // Retourne l'animation de la carte
        gsap.to(cardRef.current, {
          rotationY: flipped ? 180 : 0,
          duration: 0.6,
          ease: 'power2.out',
        });
      
        setFlipped(true);
      
        try {
          // Assurez-vous que flippedCards est bien mis à jour avec l'ID de la carte retournée
          const gameRef = doc(db, 'games', gameId); // Utilisez gameId ou sessionId
          await updateDoc(gameRef, {
            flippedCards: arrayUnion(questionData.id) // Ajoute l'ID de la carte retournée
          });
      
          // Vous devez passer la question correcte à `onCardClick`
          onCardClick(questionData); // Passe questionData (qui doit être un objet complet contenant la question et les autres détails)
        } catch (error) {
          console.error("Erreur lors de la mise à jour Firestore :", error);
        }
      };
      
    // Appliquer des styles conditionnels
    const cardStyles = {
        backgroundColor: color, // Applique la couleur dynamique
        cursor: playerId === currentTurnPlayerId && !disabled ? 'pointer' : 'not-allowed', // Change le curseur en fonction du tour
    };

    useEffect(() => {
      }, [flippedCards]);  // Log l'état de flippedCards chaque fois qu'il change
      

    return (
        <div
            ref={cardRef}
            className={`questionCard ${disabled ? 'disabled' : ''}`} // Applique la classe 'disabled' si nécessaire
            style={cardStyles} // Applique les styles dynamiques
            onClick={handleClick} // Gère l'événement de clic
        >a
            <div className="questionCard__content">
                {flipped || flippedCards[questionData.id] ? <p>{questionData.id}</p> : null} {/* Affiche un numéro ou ID de la carte */}
            </div>
        </div>

    );
};


export default QuestionCard;
