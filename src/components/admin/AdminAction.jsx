import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaUserShield, FaSpinner } from 'react-icons/fa'; // Ajout d'icônes

const AdminAction = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Charger les utilisateurs en attente
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Simulation d'un petit délai de chargement pour un meilleur UX
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const res = await axios.get('http://localhost:3001/users/pending');
      setPendingUsers(res.data);
    } catch (err) {
      setMessage("Erreur lors du chargement des utilisateurs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Valider un utilisateur
  const approveUser = async (id) => {
    try {
      await axios.put(`http://localhost:3001/users/${id}/approve`);
      setMessage("✅ Utilisateur validé avec succès !");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("❌ Erreur lors de la validation.");
    }
  };

  // Refuser/supprimer un utilisateur
  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/users/${id}`);
      setMessage("🗑️ Utilisateur supprimé.");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("❌ Erreur lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border-t-4 border-emerald-500 dark:border-blue-600">
        
        {/* Titre et icône */}
        <h2 className="text-3xl font-extrabold mb-8 text-gray-800 dark:text-gray-100 flex items-center justify-center">
          <FaUserShield className="mr-3 text-emerald-500 dark:text-blue-500 text-3xl" />
          Gestion des Accès Utilisateurs
        </h2>

        {/* Bouton de Navigation */}
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Utilisateurs en Attente de Validation :
          </h3>
          <Link
            to="/admindas"
            className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            Tableau de Bord Admin
          </Link>
        </div>

        {/* Message de Statut */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg font-medium text-center shadow-md ${
            message.includes('succès') || message.includes('supprimé') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          } animate-fade-in-up`}>
            {message}
          </div>
        )}

        {/* Affichage Principal */}
        {loading ? (
          <div className="text-center py-10 text-xl font-medium text-emerald-600 dark:text-blue-400 flex justify-center items-center">
            <FaSpinner className="mr-3 animate-spin" /> Chargement des données...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-xl text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            🎉 Aucune nouvelle demande d'utilisateur en attente.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-emerald-100 dark:bg-gray-700 dark:text-gray-300 border-b border-emerald-300 dark:border-gray-600">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">ID</th>
                  <th scope="col" className="px-6 py-3 font-bold">Email de l'utilisateur</th>
                  <th scope="col" className="px-6 py-3 text-center font-bold">Actions de l'administrateur</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.email}</td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-4 py-2 rounded-full bg-emerald-500 text-white font-bold text-xs uppercase shadow-md hover:bg-emerald-600 transition duration-200 transform hover:scale-105 flex items-center"
                      >
                        <FaCheckCircle className="mr-1" /> Valider
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="px-4 py-2 rounded-full bg-red-500 text-white font-bold text-xs uppercase shadow-md hover:bg-red-600 transition duration-200 transform hover:scale-105 flex items-center"
                      >
                        <FaTimesCircle className="mr-1" /> Refuser
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
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

export default AdminAction;