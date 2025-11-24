import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusCircle, Search, Edit2, Trash2, FileText, FileSpreadsheet, ChevronUp, ChevronDown, RefreshCw, X, Check, Clock, User, Phone, Mail, MapPin, Loader } from 'lucide-react';

// Classes de base pour les boutons d'action
const actionButtonClasses = "flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    // MODIFIÉ : cinPatient est retiré, id est ajouté pour l'édition
    id: null, 
    prenom: '',
    nom: '',
    age: '',
    adresse: '',
    email: '',
    sexe: 'Homme',
    telephone: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);

  // --- Gestion des Notifications ---
  const handleNotification = (msg, type) => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 4000 : 2500);
  };
  
  const handleError = (msg) => handleNotification(`Erreur : ${msg}`, 'error');
  const handleSuccess = (msg) => handleNotification(`Succès : ${msg}`, 'success');

  // --- Chargement des Scripts Externes (PDF & Excel) ---
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
    ])
    .then(() => {
      // Charger AutoTable après jsPDF
      return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");
    })
    .then(() => {
      setLibsLoaded(true);
    })
    .catch((err) => {
      console.error("Erreur chargement libs:", err);
      // Ne pas bloquer l'app, mais l'export ne marchera pas
    });

    fetchPatients();
  }, []);

  // --- Fetch Data ---
  const fetchPatients = () => {
    setLoading(true);
    axios.get('https://mon-api-rmv3.onrender.com/patients')
      .then(res => setPatients(res.data))
      .catch(() => {
        handleError("Impossible de charger la liste des patients (Vérifiez votre serveur API).");
      })
      .finally(() => setLoading(false));
  };

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // MODIFIÉ : L'URL utilise l'ID pour le PUT (modification)
    const url = `https://mon-api-rmv3.onrender.com/patients${isEditing ? '/' + formData.id : ''}`;
    const method = isEditing ? 'put' : 'post';
    const ageNum = Number(formData.age);

    // --- Validation Client-Side ---
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        handleError("L'âge doit être un nombre valide entre 0 et 120.");
        return;
    }
    
    // Le Nom est requis dans tous les cas
    if (!formData.nom) {
        handleError("Le Nom de famille est requis.");
        return;
    }
    
    // Préparation des données (ID n'est pas envoyé lors de l'ajout)
    const dataToSend = { 
        // MODIFIÉ : L'ID est retiré pour l'ajout (POST), mais pas pour la modification (PUT) si l'ID est dans l'URL
        ...formData, 
        age: ageNum, 
        prenom: formData.prenom || '',
    };
    if (dataToSend.id) {
        delete dataToSend.id; // L'ID ne doit pas être envoyé dans le corps de la requête PUT/POST
    }
    // --- Fin Validation Client-Side ---

    axios[method](url, dataToSend)
      .then(() => {
        fetchPatients();
        // MODIFIÉ : Réinitialisation du formulaire sans cinPatient
        setFormData({ id: null, prenom: '', nom: '', age: '', adresse: '', email: '', sexe: 'Homme', telephone: '' });
        setIsEditing(false);
        setShowForm(false);
        handleSuccess(isEditing ? "Dossier patient mis à jour." : "Nouveau patient enregistré.");
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.error || `Erreur lors de l'opération. Vérifiez les champs obligatoires.`;
        handleError(errorMsg);
      });
  };

  const handleEdit = (patient) => {
    // MODIFIÉ : L'ID est stocké dans le formData
    const patientClone = { ...patient, age: String(patient.age) };
    setFormData(patientClone);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleAdd = () => {
    // MODIFIÉ : Réinitialisation du formulaire sans cinPatient
    setFormData({ id: null, prenom: '', nom: '', age: '', adresse: '', email: '', sexe: 'Homme', telephone: '' });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    // MODIFIÉ : Réinitialisation du formulaire sans cinPatient
    setFormData({ id: null, prenom: '', nom: '', age: '', adresse: '', email: '', sexe: 'Homme', telephone: '' }); 
  };

  const handleDelete = (id) => {
    // MODIFIÉ : Utilise l'ID pour la suppression
    if (window.confirm("CONFIRMATION : Voulez-vous vraiment supprimer définitivement ce dossier patient ?")) {
      axios.delete(`https://mon-api-rmv3.onrender.com/patients/${id}`)
        .then(() => {
          fetchPatients();
          handleSuccess("Dossier patient supprimé.");
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

  const filteredPatients = patients
    .filter(p =>
      (p.nom || '').toLowerCase().includes(search.nom.toLowerCase()) &&
      (p.prenom || '').toLowerCase().includes(search.prenom.toLowerCase()) &&
      (p.email || '').toLowerCase().includes(search.email.toLowerCase()) &&
      (p.telephone || '').toLowerCase().includes(search.telephone.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredPatients.length / perPage);
  const paginatedPatients = filteredPatients.slice((page - 1) * perPage, page * perPage);

  // --- Export Functions ---
  const getExportData = () => filteredPatients.map(({ id, nom, prenom, sexe, age, adresse, email, telephone }) => ({
    // MODIFIÉ : Remplacement de CIN par ID pour l'export
    ID: id,
    Nom: nom,
    Prénom: prenom,
    Sexe: sexe,
    Âge: age,
    Adresse: adresse,
    Email: email,
    Téléphone: telephone
  }));

  const handlePrintPDF = () => {
    if (!libsLoaded || !window.jspdf) {
        handleError("Les outils PDF chargent encore, veuillez réessayer dans un instant.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const date = new Date().toLocaleDateString();
        
        // En-tête
        doc.setFontSize(18);
        doc.setTextColor(6, 78, 59);
        doc.text(`Rapport Patient MedTech - ${date}`, 14, 15);

        // MODIFIÉ : Remplacement de "CIN" par "ID" dans l'en-tête du tableau
        const tableColumn = ["ID", "Nom", "Prénom", "Sexe", "Âge", "Adresse", "Email", "Téléphone"];
        const tableRows = [];

        filteredPatients.forEach(patient => {
            tableRows.push([
                patient.id, // MODIFIÉ : Utilise patient.id
                patient.nom,
                patient.prenom,
                patient.sexe,
                patient.age,
                patient.adresse,
                patient.email,
                patient.telephone
            ]);
        });

        // Génération du tableau
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 255, 250] },
            theme: 'grid'
        });

        doc.save("patients_export.pdf");
        handleSuccess("Fichier PDF généré.");
    } catch (error) {
        console.error(error);
        handleError("Erreur lors de la génération du PDF.");
    }
  };

  const handleExportExcel = () => {
    if (!libsLoaded || !window.XLSX) {
        handleError("Les outils Excel chargent encore, veuillez réessayer dans un instant.");
        return;
    }

    try {
        const ws = window.XLSX.utils.json_to_sheet(getExportData());
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Patients");
        window.XLSX.writeFile(wb, "patients_export.xlsx");
        handleSuccess("Fichier Excel généré.");
    } catch (error) {
        console.error(error);
        handleError("Erreur lors de l'export Excel.");
    }
  };
  
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1 text-emerald-400" /> 
      : <ChevronDown className="w-4 h-4 inline-block ml-1 text-emerald-400" />;
  };

  // MODIFIÉ : Remplacement de 'cinPatient' par 'id' dans la liste des champs
  const tableFields = ['id', 'nom', 'prenom', 'sexe', 'age', 'adresse', 'email', 'telephone'];
  const getHeaderLabel = (field) => {
      switch(field) {
          case 'id': return 'ID'; // MODIFIÉ
          case 'nom': return 'Nom';
          case 'prenom': return 'Prénom';
          case 'sexe': return 'Sexe';
          case 'age': return 'Âge';
          case 'adresse': return 'Adresse';
          case 'email': return 'Email';
          case 'telephone': return 'Téléphone';
          default: return field;
      }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen w-full font-sans">
      
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transform transition-all duration-300 ease-in-out ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Titre */}
      <h2 className="text-4xl font-extrabold mb-8 text-gray-900 text-center flex items-center justify-center gap-3">
        <User className='w-8 h-8 text-emerald-500' />
        Gestion des Dossiers Patients
      </h2>

      {/* Zone de Recherche et Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <p className='text-lg font-bold text-gray-700 flex items-center gap-2'>
            <Search className="w-6 h-6 text-cyan-600" /> Filtres de Recherche :
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nom"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all shadow-sm outline-none"
              value={search.nom}
              name="nom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Prénom"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all shadow-sm outline-none"
              value={search.prenom}
              name="prenom"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Email"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all shadow-sm outline-none"
              value={search.email}
              name="email"
              onChange={handleSearchChange}
            />
            <input
              type="text"
              placeholder="Téléphone"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-800 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all shadow-sm outline-none"
              value={search.telephone}
              name="telephone"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6 justify-end items-center">
            {/* Indicateur de chargement des libs */}
            {!libsLoaded && (
                <span className="text-xs text-gray-400 flex items-center mr-2">
                    <Loader className="w-3 h-3 animate-spin mr-1" /> Init exports...
                </span>
            )}

            <button
              onClick={handleAdd}
              className={`${actionButtonClasses} bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500`}
              title="Ajouter un nouveau patient"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Ajouter Patient
            </button>
            <button
              onClick={handlePrintPDF}
              disabled={!libsLoaded}
              className={`${actionButtonClasses} ${!libsLoaded ? 'opacity-50 cursor-not-allowed' : ''} bg-red-600 text-white hover:bg-red-700 focus:ring-red-600`}
              title="Exporter au format PDF"
            >
              <FileText className="w-5 h-5 mr-2" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!libsLoaded}
              className={`${actionButtonClasses} ${!libsLoaded ? 'opacity-50 cursor-not-allowed' : ''} bg-green-600 text-white hover:bg-green-700 focus:ring-green-600`}
              title="Exporter au format Excel"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" /> Export Excel
            </button>
             <button
              onClick={fetchPatients}
              className={`${actionButtonClasses} bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-600`}
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Formulaire d'Ajout/Modification */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl text-gray-900 shadow-2xl mb-8 space-y-6 border border-cyan-200">
          <h3 className="text-2xl font-bold text-cyan-700 flex items-center gap-2">
            {isEditing ? <Edit2 className='w-6 h-6' /> : <PlusCircle className='w-6 h-6' />}
            {isEditing ? `Modification du Dossier (ID: ${formData.id})` : 'Enregistrement Patient'}
          </h3>
          {/* Mise à jour des champs requis */}
          <p className='text-sm text-gray-500'>* Champs obligatoires (Nom, Âge, Sexe)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Ligne 1 */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><User className='w-4 h-4 mr-1 text-blue-500' /> ID</label>
                {/* MODIFIÉ : Affichage de l'ID, non modifiable, non requis */}
                <input 
                    className='bg-gray-100 border-gray-300 border-2 rounded-xl px-4 py-2.5 shadow-sm text-gray-500'
                    name="id" 
                    placeholder="Auto-généré" 
                    value={formData.id || ''} 
                    disabled={true} 
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Prénom</label>
                <input 
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" 
                    name="prenom" 
                    placeholder="Prénom" 
                    value={formData.prenom} 
                    onChange={handleChange} 
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Nom*</label>
                <input 
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" 
                    name="nom" 
                    placeholder="Nom de famille" 
                    value={formData.nom} 
                    onChange={handleChange} 
                    required 
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Âge*</label>
                <input 
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" 
                    name="age" 
                    type="number" 
                    placeholder="Âge" 
                    value={formData.age} 
                    onChange={handleChange} 
                    required 
                    min="0" 
                    max="120" 
                />
            </div>

            {/* Ligne 2 */}
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><MapPin className='w-4 h-4 mr-1 text-blue-500' /> Adresse</label>
                <input className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" name="adresse" placeholder="Adresse complète" value={formData.adresse} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Mail className='w-4 h-4 mr-1 text-blue-500' /> Email</label>
                <input className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" name="email" type="email" placeholder="email@exemple.com" value={formData.email} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Sexe*</label>
                <select className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm bg-white" name="sexe" value={formData.sexe} onChange={handleChange} required>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                </select>
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center"><Phone className='w-4 h-4 mr-1 text-blue-500' /> Téléphone</label>
                <input className="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-cyan-200 focus:border-cyan-500 transition shadow-sm" name="telephone" placeholder="N° de Téléphone" value={formData.telephone} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <button type="submit" className="flex items-center bg-cyan-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-500/30">
                {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                {isEditing ? 'Mettre à jour le Dossier' : 'Enregistrer le Patient'}
            </button>
            <button type="button" onClick={handleCancel} className="flex items-center bg-gray-400 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-500 transition-all shadow-md">
                <X className="w-5 h-5 mr-2" /> Annuler / Fermer
            </button>
          </div>
        </form>
      )}

      {/* Tableau des Patients (Écran Large) */}
      <div className="mt-8 hidden md:block">
        <div className="overflow-x-auto bg-white rounded-2xl shadow-2xl border border-emerald-200">
          <table className="min-w-full w-full text-sm">
            <thead>
              <tr className="bg-emerald-100 text-emerald-800 uppercase text-left font-bold border-b-2 border-emerald-300">
                {/* Affichage des en-têtes de colonne */}
                {tableFields.map(field => (
                  <th key={field} className="px-4 py-4 cursor-pointer hover:bg-emerald-200 transition-all" onClick={() => handleSort(field)}>
                    {getHeaderLabel(field)} <SortIcon field={field} />
                  </th>
                ))}
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={tableFields.length + 1} className="text-center py-8 text-cyan-600 font-semibold text-lg flex items-center justify-center gap-3">
                    <Clock className="w-6 h-6 animate-spin" /> Chargement des dossiers médicaux...
                  </td>
                </tr>
              ) : paginatedPatients.length > 0 ? (
                paginatedPatients.map((p, index) => (
                  // MODIFIÉ : La clé utilise p.id
                  <tr key={p.id} className={`border-t border-gray-100 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50'} hover:bg-cyan-50/70`}>
                    {/* Affichage des données, y compris l'ID */}
                    <td className="px-4 py-3 font-mono text-gray-800">{p.id}</td>
                    <td className="px-4 py-3 font-extrabold text-gray-900">{p.nom}</td>
                    <td className="px-4 py-3">{p.prenom}</td>
                    <td className="px-4 py-3 font-semibold text-xs">{p.sexe}</td>
                    <td className="px-4 py-3">{p.age}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={p.adresse}>{p.adresse || 'N/A'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate text-blue-600" title={p.email}>{p.email || 'N/A'}</td>
                    <td className="px-4 py-3">{p.telephone || 'N/A'}</td>
                    <td className="px-4 py-3 space-x-2 flex justify-center">
                      <button onClick={() => handleEdit(p)} className="flex items-center bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-all text-xs shadow-md">
                        <Edit2 className="w-4 h-4 mr-1" /> Modifier
                      </button>
                      {/* MODIFIÉ : Utilise p.id pour la suppression */}
                      <button onClick={() => handleDelete(p.id)} className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-xl hover:bg-red-700 transition-all text-xs shadow-md">
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableFields.length + 1} className="text-center py-8 text-gray-500 font-medium text-lg">
                    <X className="w-6 h-6 inline-block mr-2 text-red-500" /> Aucun patient ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-5 py-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md transform hover:scale-[1.01]"
        >Précédent</button>
        <span className="font-bold text-gray-800 bg-white px-4 py-2 rounded-full shadow-lg border border-cyan-300">Page {page} / {totalPages || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-5 py-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-md transform hover:scale-[1.01]"
        >Suivant</button>
      </div>

      {/* Cartes Patients (Écran Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-6">
        {loading ? (
          <div className="text-center text-cyan-600 font-semibold py-5">Chargement des dossiers...</div>
        ) : paginatedPatients.length > 0 ? (
          paginatedPatients.map((p) => (
            // MODIFIÉ : La clé utilise p.id
            <div key={p.id} className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-emerald-500 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="font-extrabold text-xl text-gray-800">{p.nom} {p.prenom}</span>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">{p.sexe}, {p.age} ans</span>
              </div>
              <div className="text-gray-600 space-y-2 text-sm">
                <p className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-cyan-500' />
                    {/* MODIFIÉ : Affiche l'ID */}
                    <strong>ID:</strong> <span className="font-medium text-gray-800">{p.id}</span>
                </p>
                <p className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-cyan-500' />
                    <strong>Email:</strong> {p.email || 'N/A'}
                </p>
                <p className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-cyan-500' />
                    <strong>Téléphone:</strong> {p.telephone || 'N/A'}
                </p>
                <p className='flex items-center gap-2'>
                    <MapPin className='w-4 h-4 text-cyan-500' />
                    <strong>Adresse:</strong> {p.adresse || 'N/A'}
                </p>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <button onClick={() => handleEdit(p)} className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all text-sm shadow-md">
                  <Edit2 className="w-4 h-4" />
                </button>
                {/* MODIFIÉ : Utilise p.id pour la suppression */}
                <button onClick={() => handleDelete(p.id)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all text-sm shadow-md">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 text-gray-500 bg-white rounded-xl shadow-lg border border-red-200">
            <X className="w-6 h-6 inline-block mr-2 text-red-500" /> Aucun patient trouvé.
          </div>
        )}
      </div>
    </div>
  );
}