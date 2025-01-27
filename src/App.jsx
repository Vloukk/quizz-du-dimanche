import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss'

//firebase
import { app } from './firebase';
import { getFirestore, collection, getDocs } from "firebase/firestore/lite";

//pages
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import AdminPage from './pages/admin/AdminPage';
import AdminLogin from './pages/AdminLogin';
import PrivateRoute from './components/admin/PrivateRoute';

function App() {
  //firebase
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore(app);  // Initialiser Firestore avec Firebase
      const querySnapshot = await getDocs(collection(db, "your-collection"));
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    };
    
    fetchData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:sessionId" element={<Lobby />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route 
          path="/admin-page" 
          element={
            <PrivateRoute>
              <AdminPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
