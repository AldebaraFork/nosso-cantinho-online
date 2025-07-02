const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs'); // << NOVO! Precisamos disso para apagar arquivos.

// --- CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- BANCO DE DADOS ---
const db = new sqlite3.Database('./galeria.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Conectado ao banco de dados galeria.db.');
  db.run(`CREATE TABLE IF NOT EXISTS fotos (id INTEGER PRIMARY KEY, titulo TEXT, descricao TEXT, caminho TEXT, data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

// --- MIDDLEWARES ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- ROTAS DA NOSSA API ---

// ROTA POST: ENVIAR UMA NOVA FOTO
app.post('/upload', upload.single('foto'), (req, res) => {
  const { titulo, descricao } = req.body;
  const caminho = 'uploads/' + req.file.filename;
  const sql = `INSERT INTO fotos (titulo, descricao, caminho) VALUES (?, ?, ?)`;
  db.run(sql, [titulo, descricao, caminho], function(err) {
    if (err) return console.error(err.message);
    res.json({ id: this.lastID, titulo, descricao, caminho });
  });
});

// ROTA GET: PEGAR TODAS AS FOTOS
app.get('/fotos', (req, res) => {
  const sql = "SELECT * FROM fotos ORDER BY data_criacao DESC";
  db.all(sql, [], (err, rows) => {
    if (err) throw err;
    res.json(rows);
  });
});

// ✨✨✨ NOVA ROTA DELETE: APAGAR UMA FOTO ✨✨✨
app.delete('/fotos/:id', (req, res) => {
  const id = req.params.id;
  
  // 1. Achar o caminho do arquivo no DB antes de apagar o registro
  db.get(`SELECT caminho FROM fotos WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Foto não encontrada" });

    const filePath = path.join(__dirname, 'public', row.caminho);

    // 2. Apagar o arquivo da pasta /uploads
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error("Erro ao apagar arquivo:", unlinkErr);
      
      // 3. Apagar o registro do banco de dados, mesmo que o arquivo não exista mais
      db.run(`DELETE FROM fotos WHERE id = ?`, id, function(dbErr) {
        if (dbErr) return res.status(500).json({ error: dbErr.message });
        console.log(`Foto com ID ${id} deletada.`);
        res.json({ message: 'Foto deletada com sucesso' });
      });
    });
  });
});


// --- INICIAR O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor final no ar! Acesse http://localhost:${PORT}`);
});