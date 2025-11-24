import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserTie, FaUsers, FaTrash, FaHome, FaUserPlus, FaUserCheck, FaSpinner, FaLockOpen, FaClock, FaTimesCircle } from 'react-icons/fa';

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');

  // Charger admins et utilisateurs
  useEffect(() => {
    // Utiliser un `Promise.all` pour charger les deux en même temps
    Promise.all([
      axios.get('https://mon-api-rmv3.onrender.com/admins'),
      axios.get('https://mon-api-rmv3.onrender.com/users')
    ])
    .then(([adminsRes, usersRes]) => {
      setAdmins(adminsRes.data);
      setUsers(usersRes.data);
    })
    .catch(() => {
      // Afficher un message d'erreur général si les routes API sont injoignables
      setMessage("Erreur de connexion : impossible de charger les données Administrateurs/Utilisateurs.");
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
      <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl border-t-4 border-blue-600 dark:border-emerald-500 transition duration-500">
        
        {/* Titre du Tableau de Bord */}
        <h2 className="text-4xl font-extrabold mb-10 text-gray-900 dark:text-gray-100 text-center flex items-center justify-center">
            <FaUserTie className="mr-4 text-blue-600 dark:text-emerald-500 text-3xl" />
            Tableau de Bord de Supervision
        </h2>
        
        {/* Message de Statut */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg font-medium text-center shadow-md ${
            message.includes('succès') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
            : message.includes('supprimé') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          } animate-fade-in-up`}>
            {message}
          </div>
        )}
        
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
          {/* Tableau des administrateurs */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-blue-100 dark:border-gray-600">
            <h3 className="text-2xl font-bold mb-5 text-blue-600 dark:text-blue-300 flex items-center">
                <FaUserTie className="mr-2" /> Gestion des Administrateurs ({admins.length})
            </h3>
            {loadingAdmins ? (
              <div className="text-blue-600 text-center py-10 flex justify-center items-center"><FaSpinner className="mr-2 animate-spin" /> Chargement...</div>
            ) : admins.length === 0 ? (
              <div className="text-gray-500 text-center py-10">Aucun administrateur trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                  <thead className="text-xs text-gray-700 uppercase bg-blue-100 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th scope="col" className="p-3 text-left rounded-tl-lg">Email</th>
                      <th scope="col" className="p-3 text-center rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, idx) => (
                      <tr key={admin.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-150">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{admin.email}</td>
                        <td className="p-3 text-center">
                          {idx === 0 ? (
                            <span className="text-gray-400 dark:text-gray-500 italic flex items-center justify-center">
                                <FaLockOpen className="mr-1" /> Principal
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, idx)}
                              className="px-4 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase shadow-md hover:bg-red-700 transition duration-200 transform hover:scale-105 flex items-center mx-auto"
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
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-emerald-100 dark:border-gray-600">
            <h3 className="text-2xl font-bold mb-5 text-emerald-600 dark:text-emerald-300 flex items-center">
                <FaUsers className="mr-2" /> Gestion des Utilisateurs ({users.length})
            </h3>
            {loadingUsers ? (
              <div className="text-emerald-600 text-center py-10 flex justify-center items-center"><FaSpinner className="mr-2 animate-spin" /> Chargement...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-500 text-center py-10">Aucun utilisateur trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                  <thead className="text-xs text-gray-700 uppercase bg-emerald-100 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th scope="col" className="p-3 text-left rounded-tl-lg">Email</th>
                      <th scope="col" className="p-3 text-center">Statut</th>
                      <th scope="col" className="p-3 text-center rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 transition duration-150">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{user.email}</td>
                        <td className="p-3 text-center">
                          {user.isApproved ? (
                            <span className="text-green-600 font-bold flex items-center justify-center">
                                <FaUserCheck className="mr-1" /> Validé
                            </span>
                          ) : (
                            <span className="text-yellow-600 font-bold flex items-center justify-center">
                                <FaClock className="mr-1" /> En attente
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-4 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase shadow-md hover:bg-red-700 transition duration-200 transform hover:scale-105 flex items-center mx-auto"
                          >
                            <FaTimesCircle className="mr-1" /> Supprimer
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

        {/* Boutons d'action */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-6 flex-wrap">
          <Link
            to="/accueil"
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center"
          >
            <FaHome className="mr-2" /> Accueil
          </Link>
          <Link
            to="/authen"
            className="px-6 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center"
          >
            <FaUserPlus className="mr-2" /> Ajouter un admin
          </Link>
          <Link
            to="/action"
            className="px-6 py-3 rounded-full bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition duration-300 shadow-lg transform hover:scale-105 flex items-center"
          >
            <FaUserCheck className="mr-2" /> Approuver les utilisateurs
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