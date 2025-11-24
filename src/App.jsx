import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/navbar/Navbar';
import NavbarAdmin from './components/navbar/NavbarAdmin';
import Accueil from './components/pages/Accueil';
import Patients from './components/pages/Patients';
import Praticiens from './components/pages/Praticients';
import RendezVous from './components/pages/RendezVous';
import Adminaction from './components/admin/AdminAction';
import Authen from './components/admin/AdminForm';
import AdminList from './components/admin/AdminList';
import Utilisateur from './components/Utlisateur/ResisterUtil';
import UtilisateurLogin from './components/Utlisateur/utilisateurLogin';
import AdminAuth from './components/admin/AdminAuth';
import AdminDAs from './components/admin/AdminDashboard';
import Consultations from './components/pages/Consultations';
import Prescription from './components/pages/Prescription';
import Examen from './components/pages/Examen';

// --- Composant Principal App ---
export default function App() {
  // 1. Gérer l'état de connexion via localStorage
  // Vérifie si l'utilisateur est connecté au démarrage de l'application
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('userToken')
  );
  
  // 2. Définir le type de Navbar en fonction de l'état (isLoggedIn)
  // J'ai renommé showAdminNavbar en showUnauthenticatedNavbar pour plus de clarté
  const showUnauthenticatedNavbar = !isLoggedIn;

  // Effet pour synchroniser l'état de la connexion au montage du composant
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('userToken'));
  }, []);

  // Fonction à passer à UtilisateurLogin pour basculer l'état
  const handleUserLogin = () => {
    // Ici, vous devriez également stocker le token dans localStorage dans le composant UtilisateurLogin
    setIsLoggedIn(true);
  };
  
  // Fonction à passer à Navbar pour gérer la déconnexion
  const handleUserLogout = () => {
    localStorage.removeItem('userToken'); // Suppression du token pour déconnexion
    setIsLoggedIn(false);
  };

  /**
   * Composant de wrapper pour protéger les routes.
   * Redirige vers la page de connexion si non connecté.
   */
  const ProtectedRoute = ({ element }) => {
    return isLoggedIn ? element : <Navigate to="/utilisateur-login" replace />;
  };

  return (
    <Router>
      <div className="bg-gray-50 dark:bg-gray-100 min-h-screen text-gray-900 dark:text-white transition">
        
        {/* Choisir la barre de navigation en fonction de l'état de connexion */}
        {showUnauthenticatedNavbar ? 
          <NavbarAdmin /> : // Navbar non authentifié (ou Admin si c'est la version simplifiée)
          <Navbar onLogout={handleUserLogout} /> // Navbar authentifié
        }

        <Routes>
          {/* ----------------------------------------------------- */}
          {/* MODIFICATION CLÉ 1: Définir la route par défaut (/) */}
          {/* Si déjà connecté, rediriger vers l'accueil. Sinon, aller à la connexion. */}
          <Route 
            path="/" 
            element={isLoggedIn ? <Navigate to="/accueil" replace /> : <Navigate to="/utilisateur-login" replace />} 
          />
          
          {/* MODIFICATION CLÉ 2: La route de connexion est publique */}
          <Route
            path="/utilisateur-login"
            element={<UtilisateurLogin onLogin={handleUserLogin} />}
          />
          
          {/* ----------------------------------------------------- */}
          {/* Routes Protégées (nécessitent d'être connecté) */}
          <Route path="/accueil" element={<ProtectedRoute element={<Accueil />} />} />
          <Route path="/patients" element={<ProtectedRoute element={<Patients />} />} />
          <Route path="/praticiens" element={<ProtectedRoute element={<Praticiens />} />} />
          <Route path="/rendezvous" element={<ProtectedRoute element={<RendezVous />} />} />
          <Route path="/consultation" element={<ProtectedRoute element={<Consultations />} />} />
          <Route path="/prescription" element={<ProtectedRoute element={<Prescription />} />} />
          <Route path="/examen" element={<ProtectedRoute element={<Examen />} />} />
          
          {/* Routes Admin (Protégez-les aussi) */}
          <Route path="/admindas" element={<ProtectedRoute element={<AdminDAs />} />} />
          <Route path="/admin" element={<ProtectedRoute element={<AdminList />} />} />
          <Route path="/action" element={<ProtectedRoute element={<Adminaction />} />} />
          
          {/* Routes d'Authentification (Généralement publiques) */}
          <Route path="/utilisateur" element={<Utilisateur />} />
          <Route path="/authen" element={<Authen />} />
          <Route path="/admin-auth" element={<AdminAuth />} />

        </Routes>
      </div>
    </Router>
  );
}