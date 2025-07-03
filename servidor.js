const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg'); // << MUDOU! Usamos o 'pg' agora.

// --- CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- BANCO DE DADOS POSTGRESQL ---
// Conecta ao nosso banco de dados usando a chave secreta que colocamos no Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para criar a tabela se ela não existir
const criarTabela = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS fotos (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      caminho TEXT NOT NULL,
      data_criacao TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log("Tabela 'fotos' verificada/criada com sucesso.");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
};
// Executa a criação da tabela assim que o servidor liga
criarTabela();


// --- MIDDLEWARES ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO UPLOAD (Multer) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- ROTAS DA NOSSA API (ATUALIZADAS PARA POSTGRESQL) ---

// ROTA POST: ENVIAR UMA NOVA FOTO
app.post('/upload', upload.single('foto'), async (req, res) => {
  const { titulo, descricao } = req.body;
  const caminho = 'uploads/' + req.file.filename;

  const sql = `INSERT INTO fotos (titulo, descricao, caminho) VALUES ($1, $2, $3) RETURNING *`;
  try {
    const result = await pool.query(sql, [titulo, descricao, caminho]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
  }
});

// ROTA GET: PEGAR TODAS AS FOTOS
app.get('/fotos', async (req, res) => {
  const sql = "SELECT * FROM fotos ORDER BY data_criacao DESC";
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

// ROTA DELETE: APAGAR UMA FOTO
app.delete('/fotos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // 1. Achar o caminho do arquivo no DB
    const selectResult = await pool.query(`SELECT caminho FROM fotos WHERE id = $1`, [id]);
    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }
    const filePath = path.join(__dirname, 'public', selectResult.rows[0].caminho);
    
    // 2. Apagar o arquivo da pasta
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error("Erro ao apagar arquivo:", unlinkErr);
    });
    
    // 3. Apagar o registro do DB
    await pool.query(`DELETE FROM fotos WHERE id = $1`, [id]);
    res.json({ message: 'Foto deletada com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao deletar foto' });
  }
});

// --- INICIAR O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor com memória de elefante no ar! Na porta ${PORT}`);
});