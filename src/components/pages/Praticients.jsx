import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf"; // Ajouté
import "jspdf-autotable"; // Ajouté
import * as XLSX from "xlsx";
import { UserPlus, Search, Edit2, Trash2, FileSpreadsheet, ChevronUp, ChevronDown, RefreshCw, X, Check, Clock, User, Phone, Mail, FileText, Stethoscope } from 'lucide-react';

// Liste statique des spécialités pour le formulaire
const SPECIALITES_LIST = [
    { value: 'Generaliste', label: 'Médecine Générale' },
    { value: 'Cardiologie', label: 'Cardiologie' },
    { value: 'Dermatologie', label: 'Dermatologie' },
    { value: 'Pediatrie', label: 'Pédiatrie' },
    { value: 'Neurologie', label: 'Neurologie' },
    { value: 'Chirurgie', label: 'Chirurgie' },
    { value: 'Orthopedie', label: 'Orthopédie' },
    { value: 'Radiologie', label: 'Radiologie' },
    { value: 'Ophtalmologie', label: 'Ophtalmologie' },
    // Ajoutez d'autres spécialités selon vos besoins
];

export default function Praticiens() {
  const [praticiens, setPraticiens] = useState([]);
  const [formData, setFormData] = useState({
    cinPraticien: '',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    specialite: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState({ nom: '', prenom: '', specialite: '', email: '' });
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(8); // Augmenté pour la densité
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // --- Gestion des Notifications ---
  const handleNotification = (msg, type) => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 4000 : 2500);
  };
  
  const handleError = (msg) => handleNotification(`Erreur : ${msg}`, 'error');
  const handleSuccess = (msg) => handleNotification(`Succès : ${msg}`, 'success');

  // --- Fetch Data ---
  const fetchPraticiens = () => {
    setLoading(true);
    axios.get('http://localhost:3001/praticiens')
      .then(res => setPraticiens(res.data))
      .catch(() => handleError("Impossible de charger la liste des praticiens."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPraticiens();
  }, []);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddClick = () => {
    setFormData({ cinPraticien: '', nom: '', prenom: '', telephone: '', email: '', specialite: '' });
    setIsEditing(false);
    setShowForm(!showForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = isEditing ? 'put' : 'post';
    const url = `http://localhost:3001/praticiens${isEditing ? '/' + formData.cinPraticien : ''}`;
    
    // Validation CIN en mode ajout
    if (!isEditing && !formData.cinPraticien) {
        handleError("Le CIN est requis pour l'ajout d'un nouveau praticien.");
        return;
    }

    axios[method](url, formData)
      .then(() => {
        fetchPraticiens();
        setFormData({ cinPraticien: '', nom: '', prenom: '', telephone: '', email: '', specialite: '' });
        setIsEditing(false);
        setShowForm(false);
        handleSuccess(isEditing ? "Dossier praticien mis à jour." : "Nouveau praticien enregistré.");
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || `Erreur de ${isEditing ? 'mise à jour' : "création"}. CIN peut être déjà utilisé.`;
        handleError(errorMsg);
      });
  };

  const handleEdit = (p) => {
    // Cloner l'objet patient pour éviter la modification directe de l'état du tableau
    const praticienClone = { ...p };
    setFormData(praticienClone);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({ cinPraticien: '', nom: '', prenom: '', telephone: '', email: '', specialite: '' });
  };


  const handleDelete = (cinPraticien) => {
    if (window.confirm("CONFIRMATION : Voulez-vous vraiment supprimer définitivement ce dossier praticien ?")) {
      axios.delete(`https://mon-api.onrender.com/praticiens/${cinPraticien}`)
        .then(() => {
          fetchPraticiens();
          handleSuccess("Dossier praticien supprimé.");
        })
        .catch(() => handleError("Erreur lors de la suppression."));
    }
  };

  // --- Search, Sort & Pagination ---
  const handleSearchChange = (e) => {
    setSearch(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    setPage(1);
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredPraticiens = praticiens
    .filter(p =>
      (p.nom || '').toLowerCase().includes(search.nom.toLowerCase()) &&
      (p.prenom || '').toLowerCase().includes(search.prenom.toLowerCase()) &&
      (p.specialite || '').toLowerCase().includes(search.specialite.toLowerCase()) &&
      (p.email || '').toLowerCase().includes(search.email.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';

      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredPraticiens.length / perPage);
  const paginatedPraticiens = filteredPraticiens.slice((page - 1) * perPage, page * perPage);

  // --- Export Functions ---
  const getExportData = () => filteredPraticiens.map(({ cinPraticien, nom, prenom, telephone, email, specialite }) => ({
    CIN: cinPraticien,
    Nom: nom,
    Prénom: prenom,
    Téléphone: telephone,
    Email: email,
    Spécialité: specialite
  }));

  // Export PDF
  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243); // Bleu Primaire
    doc.text("Rapport Praticiens MedTech", 14, 15);
    doc.autoTable({
      head: [["CIN", "Nom", "Prénom", "Téléphone", "Email", "Spécialité"]],
      body: getExportData().map(d => Object.values(d)),
      startY: 25,
      styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255], fontStyle: 'bold' }, // Bleu Vif pour l'en-tête
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { top: 20 }
    });
    doc.save("praticiens_export.pdf");
    handleSuccess("Fichier PDF généré.");
  };

  // Export Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Praticiens");
    XLSX.writeFile(wb, "praticiens_export.xlsx");
    handleSuccess("Fichier Excel généré.");
  };

  // Icone de tri
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 inline-block ml-1 text-indigo-400" />
      : <ChevronDown className="w-4 h-4 inline-block ml-1 text-indigo-400" />;
  };

  const getSpecialiteLabel = (value) => {
    const specialite = SPECIALITES_LIST.find(s => s.value === value);
    return specialite ? specialite.label : value;
  };


  return (
    <div className="p-4 bg-gray-50 min-h-screen text-gray-800 max-w-[1800px] mx-auto">
      
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transform transition-all duration-300 ease-in-out ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Titre */}
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 text-center flex items-center justify-center gap-3">
        <Stethoscope className='w-8 h-8 text-indigo-500' />
        Gestion du Personnel Praticien
      </h1>
      
      {/* --- Zone de Recherche et Actions --- */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-indigo-100 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <p className='text-lg font-bold text-gray-700 flex items-center gap-2'>
            <Search className="w-6 h-6 text-indigo-600" /> Filtres de Recherche :
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nom"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm outline-none"
              value={search.nom}
              name="nom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Prénom"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm outline-none"
              value={search.prenom}
              name="prenom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Spécialité"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm outline-none"
              value={search.specialite}
              name="specialite"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Email"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm outline-none"
              value={search.email}
              name="email"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6 justify-end">
            <button
              onClick={handleAddClick}
              className="flex items-center bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-[1.01]"
              title={showForm ? "Fermer le formulaire" : "Ajouter un nouveau praticien"}
            >
              {showForm ? <X className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              {showForm ? 'Fermer Formulaire' : 'Nouveau Praticien'}
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center bg-red-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300"
              title="Exporter au format PDF (pour impression)"
            >
              <FileText className="w-5 h-5 mr-2" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-all duration-300"
              title="Exporter au format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" /> Export Excel
            </button>
            <button
              onClick={fetchPraticiens}
              className="flex items-center bg-gray-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:bg-gray-600 transition-all duration-300"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>
      {/* --- Fin Zone de Recherche et Actions --- */}

      {/* --- Formulaire d'Ajout/Modification --- */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl mb-8 space-y-6 border border-indigo-200 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            {isEditing ? <Edit2 className='w-6 h-6' /> : <UserPlus className='w-6 h-6' />}
            {isEditing ? 'Modification du Dossier Praticien' : 'Enregistrement d\'un Nouveau Praticien'}
          </h3>
          <p className='text-sm text-gray-500'>* Champs obligatoires</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><User className='w-4 h-4 mr-1 text-blue-500' /> CIN*</label>
                <input className="border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm" name="cinPraticien" placeholder="CIN National" value={formData.cinPraticien} onChange={handleChange} required disabled={isEditing} />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Nom*</label>
                <input className="border-2 border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm" name="nom" placeholder="Nom de famille" value={formData.nom} onChange={handleChange} required />
            </div>
            
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Prénom*</label>
                <input className="border-2 border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} required />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Phone className='w-4 h-4 mr-1 text-blue-500' /> Téléphone</label>
                <input className="border-2 border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm" name="telephone" placeholder="N° de Téléphone" value={formData.telephone} onChange={handleChange} />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Mail className='w-4 h-4 mr-1 text-blue-500' /> Email</label>
                <input className="border-2 border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm" name="email" type="email" placeholder="email@cabinet.com" value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Stethoscope className='w-4 h-4 mr-1 text-blue-500' /> Spécialité*</label>
                <select
                  className="border-2 border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-800 transition shadow-sm"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled className="text-gray-400">Choisir la spécialité</option>
                  {SPECIALITES_LIST.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <button type="submit" className={`flex items-center font-bold px-8 py-3 rounded-xl transition-all shadow-lg transform hover:scale-[1.01] ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'} text-white`}>
                {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {isEditing ? 'Mettre à jour le Dossier' : 'Enregistrer le Praticien'}
            </button>
            <button type="button" onClick={handleCancel} className="flex items-center bg-gray-400 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-500 transition-all shadow-md">
                <X className="w-5 h-5 mr-2" /> Annuler
            </button>
          </div>
        </form>
      )}
      {/* --- Fin Formulaire --- */}

      {/* --- Tableau des Praticiens (Écran Large) --- */}
      <div className="hidden md:block mt-8 animate-fade-in-up">
        <div className="overflow-x-auto bg-white rounded-2xl shadow-2xl border border-indigo-200">
          <table className="min-w-full w-full text-sm">
            <thead>
              <tr className="bg-indigo-100 text-indigo-800 uppercase text-left font-bold border-b-2 border-indigo-300">
                {/* En-têtes cliquables pour le tri */}
                {['cinPraticien', 'nom', 'prenom', 'telephone', 'email', 'specialite'].map(field => (
                  <th key={field} className="px-4 py-4 cursor-pointer hover:bg-indigo-200 transition-all" onClick={() => handleSort(field)}>
                    {field === 'cinPraticien' ? 'CIN' : (field.charAt(0).toUpperCase() + field.slice(1).replace('telephone', 'Téléphone'))} <SortIcon field={field} />
                  </th>
                ))}
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-indigo-600 font-semibold text-lg flex items-center justify-center gap-3">
                    <Clock className="w-6 h-6 animate-spin" /> Chargement des dossiers du personnel...
                  </td>
                </tr>
              ) : paginatedPraticiens.length > 0 ? (
                paginatedPraticiens.map((p, index) => (
                  <tr key={p.cinPraticien} className={`border-t border-gray-100 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'} hover:bg-cyan-50/70`}>
                    <td className="px-4 py-3 font-mono text-gray-800">{p.cinPraticien}</td>
                    <td className="px-4 py-3 font-extrabold text-gray-900">{p.nom}</td>
                    <td className="px-4 py-3">{p.prenom}</td>
                    <td className="px-4 py-3">{p.telephone || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate text-blue-600" title={p.email}>{p.email || 'N/A'}</td>
                    <td className="px-4 py-3">
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-300">{getSpecialiteLabel(p.specialite)}</span>
                    </td>
                    <td className="px-4 py-3 space-x-2 flex justify-center">
                      <button onClick={() => handleEdit(p)} className="flex items-center bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-all text-xs shadow-md">
                        <Edit2 className="w-4 h-4 mr-1" /> Modifier
                      </button>
                      <button onClick={() => handleDelete(p.cinPraticien)} className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-xl hover:bg-red-700 transition-all text-xs shadow-md">
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 font-medium text-lg">
                    <X className="w-6 h-6 inline-block mr-2 text-red-500" /> Aucun praticien ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* --- Fin Tableau --- */}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-5 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md transform hover:scale-[1.01]"
        >Précédent</button>
        <span className="font-bold text-gray-800 bg-white px-4 py-2 rounded-full shadow-lg border border-indigo-300">Page {page} / {totalPages || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-5 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md transform hover:scale-[1.01]"
        >Suivant</button>
      </div>

      {/* --- Cartes Praticiens (Écran Mobile) --- */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-6 animate-fade-in-up">
        {loading ? (
          <div className="text-center text-indigo-600 font-semibold py-5">Chargement des dossiers...</div>
        ) : paginatedPraticiens.length > 0 ? (
          paginatedPraticiens.map((p) => (
            <div key={p.cinPraticien} className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="font-extrabold text-xl text-gray-800">{p.nom} {p.prenom}</span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-300">{getSpecialiteLabel(p.specialite)}</span>
              </div>
              <div className="text-gray-600 space-y-2 text-sm">
                <p className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-indigo-500' />
                    <strong>CIN:</strong> <span className="font-medium text-gray-800">{p.cinPraticien}</span>
                </p>
                <p className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-indigo-500' />
                    <strong>Email:</strong> {p.email || 'N/A'}
                </p>
                <p className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-indigo-500' />
                    <strong>Téléphone:</strong> {p.telephone || 'N/A'}
                </p>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <button onClick={() => handleEdit(p)} className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all text-sm shadow-md">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.cinPraticien)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all text-sm shadow-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-gray-500 bg-white rounded-xl shadow-lg border border-red-200">
            <X className="w-6 h-6 inline-block mr-2 text-red-500" /> Aucun praticien trouvé.
          </div>
        )}
      </div>
      {/* --- Fin Cartes Mobiles --- */}

      {/* Animations CSS (maintenues) */}
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
  );
}