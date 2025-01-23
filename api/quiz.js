import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; // Ajoute ton URI MongoDB ici
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('quizDB'); // Remplace "quizDB" par le nom de ta base
            const questions = await db.collection('questions').find().toArray();
            res.status(200).json(questions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur serveur' });
        } finally {
            await client.close();
        }
    } else {
        res.status(405).json({ error: 'Méthode non autorisée' });
    }
}
