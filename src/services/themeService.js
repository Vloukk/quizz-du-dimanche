import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";  // Assure-toi que ce chemin est correct

export const getThemeWithQuestions = async (themeId) => {
  try {
    // Récupérer un thème spécifique par son ID
    const themeDoc = await getDoc(doc(db, "themes", themeId)); // "themes" est la collection
    if (themeDoc.exists()) {
      const themeData = themeDoc.data();

      // Vérifie si associatedQuestions est bien un tableau de chaînes
      if (Array.isArray(themeData.associatedQuestions)) {
        // Récupérer les questions associées via leurs IDs (ou groupes)
        const associatedQuestionsIds = themeData.associatedQuestions;
        
        // Tu dois probablement récupérer les questions à partir d'une autre collection
        const questions = await Promise.all(
          associatedQuestionsIds.map(async (questionId) => {
            const questionDoc = await getDoc(doc(db, "questions", questionId));  // "questions" est la collection des questions
            return questionDoc.exists() ? questionDoc.data() : null;
          })
        );

        return { themeData, questions };
      } else {
        console.log("Les questions associées ne sont pas au bon format.");
        return null;
      }
    } else {
      console.log("Le thème n'existe pas.");
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du thème et des questions : ", error);
    return null;
  }
};
