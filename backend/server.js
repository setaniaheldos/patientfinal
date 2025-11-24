const express = require('express');
const { Pool } = require('pg'); 
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. CONFIGURATION ET CONNEXION À POSTGRESQL ---

// Connexion à PostgreSQL via Render (utilisez DATABASE_URL en env var)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test_kv1n_user:pkz6hfO34ignpmoA3nHvWWx6N3mbrWN9@dpg-d4i3190dl3ps73a39280-a.oregon-postgres.render.com/test_kv1n',
  ssl: { rejectUnauthorized: false } // Nécessaire pour Render
});

pool.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à PostgreSQL :', err.message);
  } else {
    console.log('✅ Connecté à la base de données PostgreSQL sur Render');
  }
});

// Helper pour les queries async (simplifie la migration)
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error("Erreur lors de l'exécution de la requête :", err.message, "SQL:", sql);
    throw err;
  }
}

// 🔧 Création des tables (Syntaxe PostgreSQL: SERIAL pour auto-incrément, TEXT/NUMERIC pour types)
async function createTables() {
  try {
    // Table patients
    await query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY, -- Remplacé cinPatient TEXT PRIMARY KEY par id SERIAL PRIMARY KEY pour standardiser l'auto-incrément. cinPatient devient unique.
        cinPatient TEXT UNIQUE NOT NULL,
        prenom TEXT NOT NULL,
        nom TEXT NOT NULL,
        age INTEGER NOT NULL,
        adresse TEXT,
        email TEXT UNIQUE,
        sexe TEXT CHECK (sexe IN ('Homme', 'Femme')),
        telephone TEXT UNIQUE
      );
    `);

    // Table praticiens
    await query(`
      CREATE TABLE IF NOT EXISTS praticiens (
        cinPraticien TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        telephone TEXT UNIQUE,
        email TEXT UNIQUE,
        specialite TEXT
      );
    `);

    // Table rendezvous
    await query(`
      CREATE TABLE IF NOT EXISTS rendezvous (
        idRdv SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL, -- Remplacé cinPatient par patient_id (référence à la clé primaire patients)
        cinPraticien TEXT NOT NULL,
        dateHeure TIMESTAMP NOT NULL, -- DATETIME devient TIMESTAMP
        statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirme', 'annule')),
        idRdvParent INTEGER,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (cinPraticien) REFERENCES praticiens(cinPraticien) ON DELETE CASCADE,
        FOREIGN KEY (idRdvParent) REFERENCES rendezvous(idRdv)
      );
    `);

    // Table consultations
    await query(`
      CREATE TABLE IF NOT EXISTS consultations (
        idConsult SERIAL PRIMARY KEY,
        idRdv INTEGER NOT NULL,
        dateConsult TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        compteRendu TEXT,
        prix NUMERIC DEFAULT NULL, -- REAL devient NUMERIC
        FOREIGN KEY (idRdv) REFERENCES rendezvous(idRdv) ON DELETE CASCADE
      );
    `);

    // Tentative d'ajouter la colonne 'prix' si elle n'existe pas
    try {
      await query("ALTER TABLE consultations ADD COLUMN IF NOT EXISTS prix NUMERIC DEFAULT NULL");
    } catch (alterErr) {
      if (alterErr.code !== '42P07') { // 42P07 est pour 'duplicate_table' (non pertinent ici, mais la gestion d'erreur change)
        console.error("ℹ️ Impossible d'ajouter la colonne 'prix'");
      }
    }

    // Table prescriptions
    await query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        idPrescrire SERIAL PRIMARY KEY,
        idConsult INTEGER NOT NULL,
        typePrescrire TEXT NOT NULL,
        posologie TEXT NOT NULL,
        datePrescrire DATE,
        FOREIGN KEY (idConsult) REFERENCES consultations(idConsult) ON DELETE CASCADE
      );
    `);

    // Table des admins
    await query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    // Table des utilisateurs
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isApproved INTEGER DEFAULT 0 -- 0 = non validé, 1 = validé par l'admin
      );
    `);

    // Table des examens
    await query(`
      CREATE TABLE IF NOT EXISTS examens (
        idExamen SERIAL PRIMARY KEY,
        idConsult INTEGER NOT NULL,
        typeExamen TEXT NOT NULL,
        dateExamen TEXT NOT NULL,
        resultat TEXT,
        FOREIGN KEY (idConsult) REFERENCES consultations(idConsult) ON DELETE CASCADE
      );
    `);


    console.log('✅ Toutes les tables ont été créées (si elles n’existaient pas)');
  } catch (err) {
    console.error('Erreur lors de la création des tables :', err.message);
  }
}

// Exécuter la création des tables
createTables();

// --- 2. ROUTES CRUD PATIENTS ---

// Route GET : Lister les patients (Recherche par nom)
app.get('/patients', async (req, res) => {
  try {
    const { nom = '' } = req.query;
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (nom) {
      // Utilisation de ILIKE pour la recherche insensible à la casse dans PostgreSQL
      sql += ' AND LOWER(nom) LIKE $1';
      params.push(`%${nom.toLowerCase()}%`);
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter un patient
app.post('/patients', async (req, res) => {
  try {
    const { cinPatient, prenom, nom, age, adresse, email, sexe, telephone } = req.body;
    const sql = `
      INSERT INTO patients (cinPatient, prenom, nom, age, adresse, email, sexe, telephone) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id
    `;
    const result = await query(sql, [cinPatient, prenom, nom, age, adresse, email, sexe, telephone]);
    // RETURNING id donne l'ID auto-généré
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier un patient par CIN (on va utiliser CIN car c'était votre clé dans SQLite)
app.put('/patients/:cinPatient', async (req, res) => {
  try {
    const { prenom, nom, age, adresse, email, sexe, telephone } = req.body;
    const { cinPatient } = req.params;
    const sql = `
      UPDATE patients 
      SET prenom=$1, nom=$2, age=$3, adresse=$4, email=$5, sexe=$6, telephone=$7 
      WHERE cinPatient=$8 
      RETURNING *
    `;
    const result = await query(sql, [prenom, nom, age, adresse, email, sexe, telephone, cinPatient]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Patient non trouvé" });
    res.json({ modified: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer un patient par CIN
app.delete('/patients/:cinPatient', async (req, res) => {
  try {
    const result = await query(`DELETE FROM patients WHERE cinPatient=$1`, [req.params.cinPatient]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Patient non trouvé" });
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. ROUTES AUTHENTIFICATION/ADMINS/USERS ---

// Route POST : Inscription utilisateur
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    
    // Le conflit UNIQUE sera géré par l'erreur 23505
    await query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashed]);
    res.json({ message: 'Compte créé. En attente de validation par un administrateur.' });
  } catch (err) {
    if (err.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
      res.status(400).json({ error: 'Utilisateur déjà existant' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Route POST : Connexion utilisateur
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    if (user.isapproved !== 1) return res.status(403).json({ error: 'Compte en attente de validation' });

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Note: Vous devrez implémenter un JWT ou un jeton de session ici pour une API sécurisée
      const { password: _, ...safeUser } = user;
      res.json({ message: 'Connexion réussie', user: safeUser });
    } else {
      res.status(401).json({ error: 'Mot de passe incorrect' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Authentification admin
app.post('/admins/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: "Admin non trouvé" });

    const match = await bcrypt.compare(password, admin.password);
    if (match) {
      const { password: _, ...safeAdmin } = admin;
      res.status(200).json({ message: "Connexion admin réussie", admin: safeAdmin });
    } else {
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter un admin
app.post('/admins', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    const countResult = await query('SELECT COUNT(*) as count FROM admins');
    if (parseInt(countResult.rows[0].count) >= 3) return res.status(400).json({ error: "Nombre maximum d'administrateurs atteint (3)" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await query('INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id, email', [email, hashed]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: "Cet email existe déjà." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Route GET : Lister les admins
app.get('/admins', async (req, res) => {
  try {
    const result = await query('SELECT id, email FROM admins');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route GET : Lister tous les utilisateurs
app.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, email, isApproved FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Valider un utilisateur
app.put('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE users SET isApproved = 1 WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur validé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer un administrateur
app.delete('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM admins WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Admin non trouvé" });
    res.json({ message: "Admin supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer un utilisateur
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. ROUTES PRATICIENS ---

// Route GET : Lister tous les praticiens
app.get('/praticiens', async (req, res) => {
  try {
    const result = await query('SELECT * FROM praticiens');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter un praticien
app.post('/praticiens', async (req, res) => {
  try {
    const { cinPraticien, nom, prenom, telephone, email, specialite } = req.body;
    const sql = `INSERT INTO praticiens (cinPraticien, nom, prenom, telephone, email, specialite) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    await query(sql, [cinPraticien, nom, prenom, telephone, email, specialite]);
    res.status(201).json({ message: 'Praticien ajouté' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier un praticien
app.put('/praticiens/:cinPraticien', async (req, res) => {
  try {
    const { nom, prenom, telephone, email, specialite } = req.body;
    const { cinPraticien } = req.params;
    const sql = `UPDATE praticiens SET nom=$1, prenom=$2, telephone=$3, email=$4, specialite=$5 WHERE cinPraticien=$6 RETURNING *`;
    const result = await query(sql, [nom, prenom, telephone, email, specialite, cinPraticien]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Praticien non trouvé" });
    res.status(200).json({ message: 'Praticien mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer un praticien
app.delete('/praticiens/:cinPraticien', async (req, res) => {
  try {
    const result = await query(`DELETE FROM praticiens WHERE cinPraticien = $1`, [req.params.cinPraticien]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Praticien non trouvé" });
    res.status(200).json({ message: 'Praticien supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. ROUTES RENDEZ-VOUS ---

// Route GET : Tous les rendez-vous
app.get('/rendezvous', async (req, res) => {
  try {
    // Jointure pour afficher les détails du patient et du praticien
    const result = await query(`
      SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom, pr.nom as praticien_nom, pr.prenom as praticien_prenom
      FROM rendezvous r
      JOIN patients p ON r.patient_id = p.id
      JOIN praticiens pr ON r.cinPraticien = pr.cinPraticien
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Créer un rendez-vous
app.post('/rendezvous', async (req, res) => {
  try {
    const { patient_id, cinPraticien, dateHeure, statut = 'en_attente', idRdvParent = null } = req.body;
    const result = await query(
      `INSERT INTO rendezvous (patient_id, cinPraticien, dateHeure, statut, idRdvParent)
       VALUES ($1, $2, $3, $4, $5) RETURNING idRdv`,
      [patient_id, cinPraticien, dateHeure, statut, idRdvParent]
    );
    res.json({ id: result.rows[0].idRdv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier un rendez-vous (et créer une consultation si confirmé)
app.put('/rendezvous/:idRdv', async (req, res) => {
  const client = await pool.connect(); 
  try {
    await client.query('BEGIN');
    
    const { patient_id, cinPraticien, dateHeure, statut, idRdvParent } = req.body;
    const idRdv = req.params.idRdv;

    // Mise à jour du rendez-vous
    const updateResult = await client.query(
      `UPDATE rendezvous 
       SET patient_id=COALESCE($1, patient_id), 
           cinPraticien=COALESCE($2, cinPraticien), 
           dateHeure=COALESCE($3, dateHeure), 
           statut=COALESCE($4, statut), 
           idRdvParent=COALESCE($5, idRdvParent) 
       WHERE idRdv=$6 RETURNING *`,
      [patient_id, cinPraticien, dateHeure, statut, idRdvParent, idRdv]
    );

    if (updateResult.rowCount === 0) {
      throw new Error("Rendez-vous non trouvé");
    }

    // Si le statut est confirmé, vérifier et créer la consultation
    if (statut === 'confirme') {
      const existsResult = await client.query('SELECT * FROM consultations WHERE idRdv = $1', [idRdv]);
      if (existsResult.rows.length === 0) {
        const rdv = updateResult.rows[0];
        await client.query(
          'INSERT INTO consultations (idRdv, dateConsult, compteRendu) VALUES ($1, $2, $3)',
          [rdv.idRdv, rdv.dateHeure, 'Consultation initiée automatiquement']
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Rendez-vous mis à jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Route DELETE : Supprimer un rendez-vous
app.delete('/rendezvous/:idRdv', async (req, res) => {
  try {
    const result = await query(`DELETE FROM rendezvous WHERE idRdv = $1`, [req.params.idRdv]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Rendez-vous non trouvé" });
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. ROUTES CONSULTATIONS ---

// Route GET : Lister toutes les consultations
app.get('/consultations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM consultations');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter une consultation
app.post('/consultations', async (req, res) => {
  try {
    const { idRdv, dateConsult, compteRendu, prix } = req.body;
    const sql = `
      INSERT INTO consultations (idRdv, dateConsult, compteRendu, prix)
      VALUES ($1, $2, $3, $4) RETURNING idConsult
    `;
    const result = await query(sql, [idRdv, dateConsult || new Date().toISOString(), compteRendu || '', prix || null]);
    res.status(201).json({ id: result.rows[0].idConsult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier une consultation
app.put('/consultations/:idConsult', async (req, res) => {
  try {
    const { idRdv, dateConsult, compteRendu, prix } = req.body;
    const { idConsult } = req.params;
    const sql = `
      UPDATE consultations
      SET idRdv = $1, dateConsult = $2, compteRendu = $3, prix = $4
      WHERE idConsult = $5 RETURNING *
    `;
    const result = await query(sql, [idRdv, dateConsult, compteRendu, prix, idConsult]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Consultation non trouvée" });
    res.json({ modified: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer une consultation
app.delete('/consultations/:idConsult', async (req, res) => {
  try {
    const result = await query(`DELETE FROM consultations WHERE idConsult = $1`, [req.params.idConsult]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Consultation non trouvée" });
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route GET : Recherche avancée
app.get('/consultations/search', async (req, res) => {
  try {
    const { patient, praticien, date, compteRendu } = req.query;

    let sql = `
      SELECT c.*, p.nom as patient_nom, pr.nom as praticien_nom FROM consultations c
      LEFT JOIN rendezvous r ON c.idRdv = r.idRdv
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN praticiens pr ON r.cinPraticien = pr.cinPraticien
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Attention: La recherche par nom/prénom nécessite de joindre les tables
    if (patient) {
      sql += ` AND (p.nom ILIKE $${paramIndex} OR p.prenom ILIKE $${paramIndex})`;
      params.push(`%${patient}%`);
      paramIndex++;
    }
    if (praticien) {
      sql += ` AND (pr.nom ILIKE $${paramIndex} OR pr.prenom ILIKE $${paramIndex})`;
      params.push(`%${praticien}%`);
      paramIndex++;
    }
    if (date) {
      sql += ` AND DATE(c.dateConsult) = DATE($${paramIndex})`;
      params.push(date);
      paramIndex++;
    }
    if (compteRendu) {
      sql += ` AND c.compteRendu ILIKE $${paramIndex}`;
      params.push(`%${compteRendu}%`);
      paramIndex++;
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. ROUTES PRESCRIPTIONS ---

// Route GET : Lister toutes les prescriptions
app.get('/prescriptions', async (req, res) => {
  try {
    const result = await query('SELECT * FROM prescriptions');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter une prescription
app.post('/prescriptions', async (req, res) => {
  try {
    const { idConsult, typePrescrire, posologie, datePrescrire } = req.body;
    const sql = `INSERT INTO prescriptions (idConsult, typePrescrire, posologie, datePrescrire) VALUES ($1, $2, $3, $4) RETURNING idPrescrire`;
    const result = await query(sql, [idConsult, typePrescrire, posologie, datePrescrire]);
    res.status(201).json({ id: result.rows[0].idPrescrire });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier une prescription
app.put('/prescriptions/:idPrescrire', async (req, res) => {
  try {
    const { idConsult, typePrescrire, posologie, datePrescrire } = req.body;
    const { idPrescrire } = req.params;
    const sql = `UPDATE prescriptions SET idConsult=$1, typePrescrire=$2, posologie=$3, datePrescrire=$4 WHERE idPrescrire=$5 RETURNING *`;
    const result = await query(sql, [idConsult, typePrescrire, posologie, datePrescrire, idPrescrire]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Prescription non trouvée" });
    res.json({ modified: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer une prescription
app.delete('/prescriptions/:idPrescrire', async (req, res) => {
  try {
    const result = await query(`DELETE FROM prescriptions WHERE idPrescrire=$1`, [req.params.idPrescrire]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Prescription non trouvée" });
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 8. ROUTES EXAMENS ---

// Note: J'ai corrigé le nom de la table de 'examen' à 'examens' dans la création et les routes pour la cohérence.

// Route GET : Lister tous les examens
app.get('/examens', async (req, res) => {
  try {
    const result = await query('SELECT * FROM examens');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route POST : Ajouter un examen
app.post('/examens', async (req, res) => {
  try {
    const { idConsult, typeExamen, dateExamen, resultat } = req.body;
    const sql = `INSERT INTO examens (idConsult, typeExamen, dateExamen, resultat) VALUES ($1, $2, $3, $4) RETURNING idExamen`;
    const result = await query(sql, [idConsult, typeExamen, dateExamen, resultat]);
    res.status(201).json({ id: result.rows[0].idExamen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route PUT : Modifier un examen
app.put('/examens/:idExamen', async (req, res) => {
  try {
    const { idConsult, typeExamen, dateExamen, resultat } = req.body;
    const { idExamen } = req.params;
    const sql = `UPDATE examens SET idConsult=$1, typeExamen=$2, dateExamen=$3, resultat=$4 WHERE idExamen=$5 RETURNING *`;
    const result = await query(sql, [idConsult, typeExamen, dateExamen, resultat, idExamen]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Examen non trouvé" });
    res.json({ modified: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route DELETE : Supprimer un examen
app.delete('/examens/:idExamen', async (req, res) => {
  try {
    const result = await query(`DELETE FROM examens WHERE idExamen=$1`, [req.params.idExamen]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Examen non trouvé" });
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DÉMARRAGE DU SERVEUR ---

app.listen(PORT, () => {
  console.log(`🚀 API démarrée et prête à l'utilisation sur le port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM reçu, fermeture de la connexion PG...');
  await pool.end();
  process.exit(0);
});