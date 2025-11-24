import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, LogIn, Loader } from 'lucide-react'; // Importation d'icônes

const UtilisateurLogin = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nouvelle fonctionnalité : Afficher/Masquer MDP
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Ajout d'une petite validation front-end
    if (!form.email || !form.password) {
        setError("Veuillez saisir votre email et votre mot de passe.");
        setLoading(false);
        return;
    }

    try {
      const res = await axios.post('https://mon-api-rmv3.onrender.com/login', form);
      
      // Stockage du token ou des informations utilisateur si nécessaire (souvent fait ici)
      // Exemple: localStorage.setItem('token', res.data.token);
      
      setLoading(false);
      // Connexion réussie, masquer NavbarAdmin et afficher Navbar
      if (onLogin) onLogin();
      // Redirection vers la page d'accueil
      navigate('/accueil');
    } catch (err) {
      setLoading(false);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Identifiants invalides ou erreur de serveur."
      );
    }
  };

  return (
    // Arrière-plan Couleur Médicale : Émeraude/Cyan
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-cyan-100 to-teal-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        // Bordure et ombre de la carte ajustées
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-emerald-300 max-w-sm w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 
            // Titre en couleur Émeraude
            className="text-3xl font-extrabold mb-8 text-emerald-700 dark:text-emerald-300 text-center flex items-center justify-center gap-2 animate-fade-in-down"
        >
            <User className="w-7 h-7" />
            Accès Utilisateur
        </h2>
        
        {/* Affichage des Erreurs (Style amélioré) */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded-xl flex items-center justify-center gap-2 animate-bounce text-sm font-medium">
            {error}
          </div>
        )}
        
        {/* Champ Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
          <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                // Focus en couleur Émeraude
                className="mt-1 block w-full border border-emerald-300 rounded-xl pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
                autoFocus
                placeholder="Votre email"
              />
          </div>
        </div>
        
        {/* Champ Mot de passe */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mot de passe</label>
          <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                // Focus en couleur Émeraude
                className="mt-1 block w-full border border-emerald-300 rounded-xl pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 focus:ring-4 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Mot de passe"
              />
              {/* Bouton Afficher/Masquer MDP */}
              <button 
                  type="button" 
                  onClick={() => setShowPassword(prev => !prev)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-emerald-600 transition"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
          </div>
        </div>
        
        {/* Liens de navigation supplémentaires */}
        <div className="flex justify-between text-sm mb-6 mt-2">
            <Link to="/register" className="text-emerald-600 hover:text-emerald-800 font-medium transition-all">
                S'inscrire
            </Link>
            <Link to="/mot-de-passe-oublie" className="text-gray-500 hover:text-emerald-600 transition-all">
                Mot de passe oublié ?
            </Link>
        </div>

        {/* Bouton de Connexion (Couleur Émeraude) */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/50 transform hover:scale-[1.01]'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Connexion en cours...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Se connecter
            </>
          )}
        </button>

        {/* Styles d'animation (Conservés) */}
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.7s;
          }
          .animate-bounce {
            animation: bounce 1s;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-8px);}
          }
        `}</style>
      </form>
    </div>
  );
};

export default UtilisateurLogin;