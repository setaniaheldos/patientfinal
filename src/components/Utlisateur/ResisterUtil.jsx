import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Loader, CheckCircle, XCircle } from 'lucide-react';

const ResisterUtil = () => {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // COULEURS DU THÈME MÉDICAL : sky-700 (Primaire) et teal-600 (Secondaire/Validation)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email || !form.password) {
      setError("Email et mot de passe requis");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      // Assurez-vous que cette URL est correcte pour votre backend
      const res = await axios.post('https://mon-api-rmv3.onrender.com/register', { 
        email: form.email,
        password: form.password,
      });
      // Message de succès ajusté pour inclure la validation par l'admin
      setSuccess(res.data.message || "Inscription réussie ! Votre compte est en attente de validation par l'administrateur.");
      setError('');
      setForm({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 5000); // Laisser plus de temps pour lire l'information importante
    } catch (err) {
      setSuccess('');
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur lors de l'inscription (Vérifiez le serveur et l'unicité de l'email)"
      );
    }
    setLoading(false);
  };

  return (
    // Fond avec dégradé bleu-vert
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-teal-100 to-sky-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        // Design du formulaire : Bordure et ombre renforcées
        className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-3xl border-t-8 border-sky-700 dark:border-teal-500 max-w-md w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 
          // Titre en couleur principale (Bleu Ciel Profond)
          className="text-3xl font-extrabold mb-8 text-sky-800 dark:text-teal-400 text-center flex items-center justify-center gap-2 animate-fade-in-down pb-2 border-b border-gray-100 dark:border-gray-700"
        >
          <UserPlus className="w-8 h-8 text-teal-600 dark:text-sky-500" />
          Création de Compte Utilisateur
        </h2>
        
        {/* Messages d'erreur et de succès avec icônes (couleurs ajustées) */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-bounce text-sm font-medium border-l-4 border-red-500 shadow-md">
            <XCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-teal-100 text-teal-800 rounded-xl flex items-center gap-3 animate-fade-in-up text-sm font-medium border-l-4 border-teal-500 shadow-md">
            <CheckCircle className="w-5 h-5 flex-shrink-0" /> {success}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Adresse Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // Styles focus/bordure en Bleu Ciel Profond
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-200/50 transition-all outline-none"
            autoFocus
          />
        </div>
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-200/50 transition-all outline-none"
          />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Confirmer le mot de passe</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-200/50 transition-all outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          // Bouton principal en Vert Sarcelle (teal)
          className={`w-full py-3 rounded-full font-extrabold transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-gray-700'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-500/50 transform hover:scale-[1.02] active:scale-[0.98]'
          } animate-fade-in-up`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Envoi...
            </>
          ) : (
            "S'INSCRIRE ET DEMANDER L'ACCÈS"
          )}
        </button>
        {/* Les styles d'animation restent les mêmes */}
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

export default ResisterUtil;