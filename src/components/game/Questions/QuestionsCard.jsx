import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const QuestionCard = ({ questionData, onCardClick }) => {
    const [flipped, setFlipped] = useState(false);
    const [color, setColor] = useState('black');
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.set(cardRef.current, { rotationY: 180 }); // Initialement cachée
        
        const colorTimeout = setTimeout(() => {
            setColor(questionData.color);
        }, 1000);
        
        const resetTimeout = setTimeout(() => {
            setColor('black');
        }, 31000);
        
        return () => {
            clearTimeout(colorTimeout);
            clearTimeout(resetTimeout);
        };
    }, [questionData.color]);

    const handleClick = () => {
        gsap.to(cardRef.current, {
            rotationY: flipped ? 180 : 0,
            duration: 0.6,
            ease: 'power2.out',
        });
        
        setFlipped(!flipped);
        onCardClick(questionData); // Appeler une fonction parent pour afficher la modal
    };

    return (
        <div
            ref={cardRef}
            className="questionCard"
            style={{ backgroundColor: color }}
            onClick={handleClick}
        >
            <div className="questionCard__content">
                {flipped ? <p>{questionData.question}</p> : null}
            </div>
        </div>
    );
};

export default QuestionCard;
