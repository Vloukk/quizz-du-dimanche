import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const QuestionCard = ({ playerId, questionData, onCardClick, disabled, currentTurnPlayerId, gameId, flippedCards, gameStarted }) => {
    const [flipped, setFlipped] = useState(false);
    const [color, setColor] = useState(localStorage.getItem('cardsRevealed') ? 'black' : questionData.color);
    const [isClickable, setIsClickable] = useState(localStorage.getItem('cardsRevealed') ? true : false);
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.set(cardRef.current, { rotationY: 180 });

        if (!localStorage.getItem('cardsRevealed')) {
            const revealTimeout = setTimeout(() => {
                setColor('black');
                setIsClickable(true);
                localStorage.setItem('cardsRevealed', 'true');
            }, 30000);

            return () => clearTimeout(revealTimeout);
        }
    }, [questionData.color]);

    const handleClick = async () => {
        if (!isClickable || playerId !== currentTurnPlayerId || disabled || flipped) {
            console.log("Action impossible : carte non cliquable, ce n'est pas ton tour ou déjà retournée !");
            return;
        }

        gsap.to(cardRef.current, {
            rotationY: flipped ? 180 : 0,
            duration: 0.6,
            ease: 'power2.out',
        });

        setFlipped(true);
        setColor(questionData.color);

        try {
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                flippedCards: arrayUnion(questionData.id)
            });

            onCardClick(questionData);
        } catch (error) {
            console.error("Erreur lors de la mise à jour Firestore :", error);
        }
    };

    const cardStyles = {
        backgroundColor: flipped || flippedCards[questionData.id] ? questionData.color : color,
        cursor: isClickable && playerId === currentTurnPlayerId && !disabled ? 'pointer' : 'not-allowed',
        transition: 'background-color 0.5s ease',
    };

    return (
        <div
            ref={cardRef}
            className={`questionCard ${disabled ? 'disabled' : ''}`}
            style={cardStyles}
            onClick={handleClick}
        />
    );
};

export default QuestionCard;
