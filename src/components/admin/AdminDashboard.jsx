import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaUserTie, FaUsers, FaTrash, FaHome, FaUserPlus, 
    FaUserCheck, FaSpinner, FaLockOpen, FaClock, FaTimesCircle,
    FaHeartbeat // Nouvelle icône pour la touche médicale
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');

  // COULEURS MÉDICALES :
  // Primaire (Confiance/Technologie) : sky-700 (Bleu ciel profond) / sky-300 (mode sombre)
  // Secondaire (Santé/Bien-être) : teal-600 (Vert sarcelle) / teal-300 (mode sombre)
  // Alerte/Suppression : red-600

  // Charger admins et utilisateurs
  useEffect(() => {
    Promise.all([
      axios.get('https://mon-api-rmv3.onrender.com/admins'),
      axios.get('https://mon-api-rmv3.onrender.com/users')
    ])
    .then(([adminsRes, usersRes]) => {
      setAdmins(adminsRes.data);
      setUsers(usersRes.data);
    })
    .catch(() => {
      setMessage("❌ Erreur de connexion : impossible de charger les données Administrateurs/Utilisateurs. Vérifiez l'API.");
    })
    .finally(() => {
      setLoadingAdmins(false);
      setLoadingUsers(false);
    });
  }, []);

  // Supprimer un admin (sauf le premier)
  const handleDeleteAdmin = async (id, idx) => {
    if (idx === 0) {
        setMessage("⚠️ Le premier administrateur n'est pas supprimable pour garantir l'accès.");
        setTimeout(() => setMessage(''), 4000);
        return;
    } 
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet Administrateur ?")) return;
    try {
      await axios.delete(`https://mon-api-rmv3.onrender.com/admins/${id}`);
      setAdmins(admins.filter(a => a.id !== id));
      setMessage("🗑️ Administrateur supprimé avec succès !");
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage("❌ Erreur lors de la suppression de l'administrateur.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet Utilisateur ?")) return;
    try {
      await axios.delete(`https://mon-api-rmv3.onrender.com/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setMessage("🗑️ Utilisateur supprimé avec succès !");
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage("❌ Erreur lors de la suppression de l'utilisateur.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-3xl border-t-8 border-sky-700 dark:border-teal-500 transition duration-700">
        
        {/* Titre du Tableau de Bord */}
        <h2 className="text-4xl font-extrabold mb-12 text-gray-900 dark:text-gray-100 text-center flex items-center justify-center">
            <FaHeartbeat className="mr-4 text-sky-700 dark:text-teal-500 text-3xl" />
            Espace de Supervision Médicale
        </h2>
        
        {/* Message de Statut */}
        {message && (
          <div className={`mb-8 px-5 py-3 rounded-lg font-semibold text-center shadow-lg transition duration-500 ${
            message.includes('succès') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
            : message.includes('supprimé') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
          } animate-fade-in-up`}>
            {message}
          </div>
        )}
        
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            
          {/* Tableau des administrateurs */}
          <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-xl border-l-4 border-sky-600 dark:border-sky-400">
            <h3 className="text-2xl font-bold mb-6 text-sky-700 dark:text-sky-300 flex items-center">
                <FaUserTie className="mr-3 text-2xl" /> Gestion des Administrateurs ({admins.length})
            </h3>
            {loadingAdmins ? (
              <div className="text-sky-600 text-center py-12 flex justify-center items-center text-lg"><FaSpinner className="mr-3 animate-spin" /> Chargement des profils...</div>
            ) : admins.length === 0 ? (
              <div className="text-gray-500 text-center py-12 italic">Aucun administrateur actif trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                  <thead className="text-xs text-gray-700 uppercase bg-sky-50 dark:bg-gray-700/70 dark:text-sky-300">
                    <tr>
                      <th scope="col" className="p-4 text-left rounded-tl-lg">Email</th>
                      <th scope="col" className="p-4 text-center rounded-tr-lg">Statut/Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, idx) => (
                      <tr key={admin.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-sky-50 dark:hover:bg-gray-700 transition duration-200">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{admin.email}</td>
                        <td className="p-4 text-center">
                          {idx === 0 ? (
                            <span className="text-sky-700 dark:text-sky-400 font-semibold italic flex items-center justify-center">
                                <FaLockOpen className="mr-2" /> Clé de voûte
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, idx)}
                              className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs uppercase shadow-md hover:bg-red-700 transition duration-200 transform hover:scale-105 flex items-center mx-auto"
                            >
                              <FaTrash className="mr-1" /> Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tableau des utilisateurs */}
          <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-xl border-l-4 border-teal-600 dark:border-teal-400">
            <h3 className="text-2xl font-bold mb-6 text-teal-700 dark:text-teal-300 flex items-center">
                <FaUsers className="mr-3 text-2xl" /> Gestion des Utilisateurs ({users.length})
            </h3>
            {loadingUsers ? (
              <div className="text-teal-600 text-center py-12 flex justify-center items-center text-lg"><FaSpinner className="mr-3 animate-spin" /> Chargement des comptes...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-500 text-center py-12 italic">Aucun utilisateur enregistré trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                  <thead className="text-xs text-gray-700 uppercase bg-teal-50 dark:bg-gray-700/70 dark:text-teal-300">
                    <tr>
                      <th scope="col" className="p-4 text-left rounded-tl-lg">Email</th>
                      <th scope="col" className="p-4 text-center">Statut</th>
                      <th scope="col" className="p-4 text-center rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700 transition duration-200">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{user.email}</td>
                        <td className="p-4 text-center">
                          {user.isApproved ? (
                            <span className="text-green-600 font-semibold flex items-center justify-center">
                                <FaUserCheck className="mr-1" /> Actif
                            </span>
                          ) : (
                            <span className="text-green-600 font-semibold flex items-center justify-center">
                                <FaClock className="mr-1" /> En attente/Actif
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs uppercase shadow-md hover:bg-red-700 transition duration-200 transform hover:scale-105 flex items-center mx-auto"
                          >
                            <FaTimesCircle className="mr-1" /> Bannir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action : Couleur médicale + boutons d'action spécifiques */}
        <div className="mt-12 pt-8 border-t-2 border-gray-100 dark:border-gray-700 flex justify-center gap-8 flex-wrap">
          <Link
            to="/accueil"
            className="px-8 py-3 rounded-full bg-sky-600 text-white font-bold hover:bg-sky-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center text-sm"
          >
            <FaHome className="mr-2" /> Retour à l'Accueil
          </Link>
          <Link
            to="/authen"
            className="px-8 py-3 rounded-full bg-teal-600 text-white font-bold hover:bg-teal-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center text-sm"
          >
            <FaUserPlus className="mr-2" /> Créer un Administrateur
          </Link>
          <Link
            to="/action"
            className="px-8 py-3 rounded-full bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center text-sm"
          >
            <FaUserPlus className="mr-2" /> Approuver les Comptes
          </Link>
        </div>

        {/* Style d'animation conservé */}
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;