import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    FaCheckCircle, FaTimesCircle, FaUserShield, FaSpinner, 
    FaUserEdit, FaSearch, FaChevronLeft, FaChevronRight, FaCalendarAlt 
} from 'react-icons/fa';

const AdminAction = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Nouvelle fonctionnalité : Recherche
  
  // -- Pagination (Simulation Simple) --
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  
  // COULEURS MÉDICALES : sky-700 (Primaire) et teal-600 (Validation)

  // Charger les utilisateurs en attente
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // API doit retourner la date d'inscription (ex: 'createdAt') pour la nouvelle fonctionnalité
      const res = await axios.get('https://mon-api-rmv3.onrender.com/users/pending');
      // Ajout de dates de création simulées si l'API ne les fournit pas, pour l'exemple
      const usersWithDates = res.data.map(user => ({
          ...user,
          createdAt: user.createdAt || new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      setPendingUsers(usersWithDates);
    } catch (err) {
      setMessage("❌ Erreur de connexion : impossible de charger les utilisateurs en attente.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // 1. Valider un utilisateur
  const approveUser = async (id) => {
    if (!window.confirm("Confirmer la validation de cet utilisateur ?")) return;
    try {
      await axios.put(`https://mon-api-rmv3.onrender.com/users/${id}/approve`);
      setMessage("✅ Utilisateur validé avec succès ! Son accès est accordé.");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("❌ Erreur lors de la validation. Vérifiez la route API.");
    }
  };

  // 2. Refuser/supprimer un utilisateur
  const deleteUser = async (id) => {
    if (!window.confirm("Confirmer le REFUS et la suppression de ce compte ?")) return;
    try {
      await axios.delete(`https://mon-api-rmv3.onrender.com/users/${id}`);
      setMessage("🗑️ Utilisateur refusé et compte supprimé.");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("❌ Erreur lors de la suppression.");
    }
  };

  // 3. PROMOTION D'UTILISATEUR (Nouvelle Fonctionnalité)
  const promoteUser = async (id, email) => {
    if (!window.confirm(`Voulez-vous promouvoir ${email} au rang d'Administrateur ?`)) return;
    try {
        // NOTE: Ceci est une route API hypothétique pour la promotion
        // Il faudrait implémenter cette route sur votre backend.
        await axios.post('https://mon-api-rmv3.onrender.com/admins/promote', { userId: id }); 
        
        setMessage(`👑 ${email} a été promu Administrateur avec succès!`);
        // Supprime l'utilisateur de la liste d'attente car son statut est souvent mis à jour
        setPendingUsers(pendingUsers.filter(u => u.id !== id)); 
        setTimeout(() => setMessage(''), 4000);
    } catch (err) {
        setMessage("❌ Erreur lors de la promotion. L'utilisateur est-il déjà un admin ?");
    }
  };

  // Logique de Filtrage et de Pagination
  const filteredUsers = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto mt-12 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-3xl border-t-8 border-teal-600 dark:border-sky-500 transition duration-700">
        
        {/* Titre et icône (Design Médical) */}
        <h2 className="text-4xl font-extrabold mb-10 text-gray-900 dark:text-gray-100 flex items-center justify-center border-b pb-4 border-gray-100 dark:border-gray-700">
          <FaUserShield className="mr-4 text-teal-600 dark:text-sky-500 text-3xl" />
          Validation et Rôles des Nouveaux Utilisateurs
        </h2>

        {/* Message de Statut */}
        {message && (
          <div className={`mb-8 px-5 py-3 rounded-lg font-semibold text-center shadow-lg transition duration-500 ${
            message.includes('succès') || message.includes('promu') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
            : message.includes('supprimé') || message.includes('refusé') ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
          } animate-fade-in-up`}>
            {message}
          </div>
        )}
        
        {/* Barre de Contrôle (Recherche et Navigation) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            
            {/* Champ de Recherche */}
            <div className="relative w-full md:w-1/2">
                <input
                    type="text"
                    placeholder="Rechercher par email..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white transition duration-200"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset pagination lors de la recherche
                    }}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Bouton de Navigation */}
            <Link
                to="/admindas"
                className="px-6 py-3 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition duration-300 shadow-md hover:shadow-lg flex items-center w-full md:w-auto justify-center"
            >
                <FaChevronLeft className="mr-2" /> Tableau de Bord Principal
            </Link>
        </div>

        {/* Affichage Principal */}
        {loading ? (
          <div className="text-center py-12 text-xl font-medium text-teal-600 dark:text-sky-400 flex justify-center items-center">
            <FaSpinner className="mr-3 animate-spin" /> Chargement des demandes d'inscription...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-xl text-gray-500 dark:text-gray-400 border border-dashed border-sky-300 dark:border-teal-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            🎉 Aucune nouvelle demande d'utilisateur en attente correspondant à la recherche.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs text-gray-700 uppercase bg-teal-50 dark:bg-gray-700 dark:text-teal-300">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold">Email de l'utilisateur</th>
                  <th scope="col" className="px-6 py-4 text-center font-bold flex items-center justify-center">
                    <FaCalendarAlt className="mr-1" /> Inscrit depuis
                  </th>
                  <th scope="col" className="px-6 py-4 text-center font-bold">Actions de Validation</th>
                  <th scope="col" className="px-6 py-4 text-center font-bold">Gestion des Rôles</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700 transition duration-150">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="text-gray-600 dark:text-gray-400">{user.createdAt}</span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-4 py-2 rounded-full bg-teal-600 text-white font-semibold text-xs uppercase shadow-md hover:bg-teal-700 transition duration-200 transform hover:scale-105 flex items-center"
                      >
                        <FaCheckCircle className="mr-1" /> Valider
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs uppercase shadow-md hover:bg-red-700 transition duration-200 transform hover:scale-105 flex items-center"
                      >
                        <FaTimesCircle className="mr-1" /> Refuser
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <button
                            onClick={() => promoteUser(user.id, user.email)}
                            className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold text-xs uppercase shadow-md hover:bg-sky-700 transition duration-200 transform hover:scale-105 flex items-center mx-auto"
                        >
                            <FaUserEdit className="mr-1" /> Promouvoir Admin
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contrôles de Pagination */}
        {filteredUsers.length > usersPerPage && (
            <div className="flex justify-end items-center mt-6">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-4">
                    Page {currentPage} sur {totalPages}
                </span>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 text-sm font-medium ${
                            currentPage === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-sky-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } dark:text-white`}
                    >
                        <FaChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 text-sm font-medium ${
                            currentPage === totalPages ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-sky-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } dark:text-white`}
                    >
                        <FaChevronRight className="h-5 w-5" />
                    </button>
                </nav>
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