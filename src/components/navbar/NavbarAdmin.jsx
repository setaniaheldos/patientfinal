import React, { useState } from 'react';
import { Menu, X, Users, UserPlus, LogOut, Shield, Home, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NavbarAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // COULEURS DU THÈME :
  // Principal (actif) : sky-700 (Bleu Confiance)
  // Secondaire (hover) : teal-600 (Vert Sarcelle)
  
  // NOUVEAU : Ajout du lien Dashboard en tête
  const navItems = [
    // { to: '/admindas', label: 'Dashboard', icon: <Home size={20} className="mr-2" /> },
    { to: '/admin-auth', label: 'Gest. Admins', icon: <Shield size={20} className="mr-2" /> },
    { to: '/utilisateur-login', label: 'Connexion Utilisateurs ', icon: <Users size={20} className="mr-2" /> },
    { to: '/utilisateur', label: 'Inscription Utilisateurs', icon: <UserPlus size={20} className="mr-2" /> },
  ];

  // Styles de lien mis à jour avec les couleurs sky/teal
  const navLink = (to) =>
    `flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium whitespace-nowrap ${ // Ajout de whitespace-nowrap
      location.pathname === to
        ? 'bg-sky-700 bg-opacity-90 text-white shadow-lg shadow-sky-500/30' // Couleur active : Bleu Ciel Profond
        : 'hover:bg-teal-100 dark:hover:bg-gray-700 hover:text-teal-700 dark:hover:text-teal-300 text-gray-700 dark:text-gray-200'
    }`;

  const handleLogout = () => {
    // localStorage.removeItem('adminToken'); // décommente si tu utilises un token
    navigate('/admin-auth');
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-900/95 shadow-2xl sticky top-0 z-50 animate-fade-in-down backdrop-blur-sm border-b-4 border-sky-700 dark:border-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center"> {/* px réduit pour petits écrans */}
          
          {/* Logo et Toggle */}
          <div className="flex items-center gap-2 sm:gap-4"> {/* gap réduit pour petits écrans */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-teal-100 dark:hover:bg-gray-700 transition"
              aria-label="Ouvrir le menu"
            >
              {sidebarOpen ? <X size={28} className="animate-fade-in-up" /> : <Menu size={28} className="animate-fade-in-down" />} {/* Icônes légèrement plus petites */}
            </button>
            
            {/* Titre : NON CLICQUABLE */}
            <span 
                className="text-xl sm:text-3xl font-extrabold text-sky-700 dark:text-teal-400 tracking-wider flex items-center gap-2 select-none" // Taille ajustée
            >
              <Shield size={28} className="text-teal-600 dark:text-sky-400 animate-bounce hidden sm:inline" /> {/* Icône plus petite et masquée sur XS */}
              <span className='hidden sm:inline'>Espace</span> Admin
            </span>
          </div>
          
          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Conteneur des Liens */}
            <div className="flex space-x-2">
                {navItems.map(item => (
                <Link key={item.to} to={item.to} className={navLink(item.to)}>
                    {item.icon}
                    <span>{item.label}</span>
                </Link>
                ))}
            </div>
            
            {/* Bouton Déconnexion (Réactivé) */}
            {/* <button
              onClick={handleLogout}
              // Bouton Déconnexion : Couleur d'alerte Rouge, design amélioré
              className="flex items-center px-4 py-2 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all ml-6 shadow-xl shadow-red-500/30 transform hover:scale-105"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button> */}
          </div>
        </div>
      </nav>

      {/* Sidebar responsive */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!sidebarOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-500 backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <aside
          className={`absolute left-0 top-0 h-full w-64 xs:w-72 bg-white/95 dark:bg-gray-900/95 shadow-2xl transform transition-transform duration-500 border-r-4 border-sky-700 dark:border-teal-500
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} animate-slide-in backdrop-blur-lg`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700"> {/* px réduit */}
            <span className="text-xl font-bold text-sky-700 dark:text-teal-400 flex items-center gap-2">
              <Shield size={24} />
              Menu Admin
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-teal-100 dark:hover:bg-gray-700 transition"
              aria-label="Fermer le menu"
            >
              <X size={28} />
            </button>
          </div>
          
          <nav className="flex flex-col gap-1 mt-4 px-3">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={navLink(item.to)}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Bouton Déconnexion Sidebar (Réactivé) */}
            {/* <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all mt-8 shadow-xl shadow-red-500/30"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button> */}
          </nav>
        </aside>
      </div>

      {/* Styles d'animation conservés */}
      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.7s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s;
        }
        .animate-bounce {
          animation: bounce 1.2s infinite;
        }
        .animate-slide-in {
          animation: slideInSidebar 0.5s;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
        @keyframes slideInSidebar {
          from { opacity: 0; transform: translateX(-100%);}
          to { opacity: 1; transform: translateX(0);}
        }
      `}</style>
    </>
  );
}