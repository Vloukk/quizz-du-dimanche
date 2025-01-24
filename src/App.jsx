import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss'

//pages
import Home from './pages/Home';
import Lobby from './pages/Lobby';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:gameId" element={<Lobby />} />
      </Routes>
    </Router>
  );
}

export default App;
