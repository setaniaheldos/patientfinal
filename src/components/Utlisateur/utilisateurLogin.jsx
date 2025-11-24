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
  
  // COULEURS DU THÈME MÉDICAL : sky-700 (Primaire) et teal-600 (Secondaire/Validation)

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
          : "Identifiants invalides ou erreur de serveur. Vérifiez si votre compte est validé par l'administrateur." // Message mis à jour
      );
    }
  };

  return (
    // Fond avec dégradé bleu-vert cohérent avec ResisterUtil
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-teal-100 to-sky-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        // Design du formulaire : Bordure et ombre renforcées (cohérent avec ResisterUtil)
        className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-3xl border-t-8 border-sky-700 dark:border-teal-500 max-w-md w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 
            // Titre en couleur principale (Bleu Ciel Profond)
            className="text-3xl font-extrabold mb-8 text-sky-800 dark:text-teal-400 text-center flex items-center justify-center gap-2 animate-fade-in-down pb-2 border-b border-gray-100 dark:border-gray-700"
        >
            <User className="w-8 h-8 text-teal-600 dark:text-sky-500" />
            Accès Utilisateur
        </h2>
        
        {/* Affichage des Erreurs (Style amélioré) */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-100 text-red-700 rounded-xl flex items-center justify-center gap-3 animate-bounce text-sm font-medium border-l-4 border-red-500 shadow-md">
            <XCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}
        
        {/* Champ Email */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Adresse Email</label>
          <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 dark:text-sky-500" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                // Focus en couleur Bleu Ciel Profond
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-200/50 transition-all outline-none"
                autoFocus
                placeholder="Votre email professionnel"
              />
          </div>
        </div>
        
        {/* Champ Mot de passe */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Mot de passe</label>
          <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-600 dark:text-sky-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                // Focus en couleur Bleu Ciel Profond
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-200/50 transition-all outline-none"
                placeholder="Mot de passe sécurisé"
              />
              {/* Bouton Afficher/Masquer MDP */}
              <button 
                  type="button" 
                  onClick={() => setShowPassword(prev => !prev)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-sky-600 transition"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
          </div>
        </div>
        
        {/* Liens de navigation supplémentaires */}
        <div className="flex justify-between text-sm mb-8 mt-2">
            <Link 
              to="/utilisateur" 
              // Lien en Vert Sarcelle
              className="text-teal-600 hover:text-teal-800 font-medium transition-all text-base"
            >
                Pas encore de compte ? S'inscrire
            </Link>
            <Link to="/mot-de-passe-oublie" className="text-gray-500 hover:text-sky-600 transition-all text-base">
                Mot de passe oublié ?
            </Link>
        </div>

        {/* Bouton de Connexion (Couleur Vert Sarcelle) */}
        <button
          type="submit"
          disabled={loading}
          // Bouton principal en Vert Sarcelle (teal)
          className={`w-full py-3 rounded-full font-extrabold transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-500/50 transform hover:scale-[1.02] active:scale-[0.98]'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Authentification...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" /> CONNEXION
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
          .shadow-3xl {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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