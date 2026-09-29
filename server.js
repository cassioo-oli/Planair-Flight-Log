require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const app = express();
const pastaUploads = path.join(__dirname, 'uploads');
fs.mkdirSync(pastaUploads, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: pastaUploads,
    filename: (_r, f, cb) =>
      cb(
        null,
        `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, f, cb) =>
    cb(
      f.mimetype === 'application/pdf' ? null : new Error('Envie somente PDF.'),
      f.mimetype === 'application/pdf',
    ),
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(pastaUploads));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const campos = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];
const rotulos = ['Entrada', 'Saída para almoço', 'Retorno do almoço', 'Saída'];
const hoje = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const dif = (a, b) =>
  a && b ? Math.round((new Date(b) - new Date(a)) / 60000) : 0;
const hhmm = (n) =>
  `${n < 0 ? '-' : ''}${String(Math.floor(Math.abs(n) / 60)).padStart(2, '0')}:${String(Math.abs(n) % 60).padStart(2, '0')}`;

function calcular(r, meta) {
  const m = dif(r.entrada, r.saida_almoco) + dif(r.retorno_almoco, r.saida);
  return {
    trabalhados: m,
    meta,
    saldo: m - meta,
    completo: campos.every((c) => r[c]),
  };
}

function dentroDaJanela(funcionario, indice) {
  const agora = new Date()
    .toLocaleTimeString('en-CA', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
    })
    .slice(0, 5);
  const colunas = [
    'horario_entrada',
    'horario_saida_almoco',
    'horario_retorno_almoco',
    'horario_saida',
  ];
  const previsto = String(funcionario[colunas[indice]]).slice(0, 5);
  const paraMin = (x) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));

  return Math.abs(paraMin(agora) - paraMin(previsto)) <= 60;
}

app.get('/api/funcionarios', async (_q, res) => {
  const [r] = await db.query(
    'SELECT id,nome,email,cargo,carga_horaria_diaria_minutos FROM funcionarios WHERE ativo=1 ORDER BY nome',
  );
  res.json(r);
});

app.post('/api/funcionarios', async (req, res) => {
  const {
    nome,
    email,
    cargo = '',
    cargaHorariaMinutos,
    entrada = '08:00',
    saidaAlmoco = '12:00',
    retornoAlmoco = '13:00',
    saida = '17:00',
  } = req.body;

  if (
    !nome ||
    !email ||
    !Number.isInteger(cargaHorariaMinutos) ||
    cargaHorariaMinutos < 1
  ) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    const [r] = await db.execute(
      'INSERT INTO funcionarios(nome,email,cargo,carga_horaria_diaria_minutos,horario_entrada,horario_saida_almoco,horario_retorno_almoco,horario_saida) VALUES(?,?,?,?,?,?,?,?)',
      [
        nome,
        email,
        cargo,
        cargaHorariaMinutos,
        entrada,
        saidaAlmoco,
        retornoAlmoco,
        saida,
      ],
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    res.status(400).json({
      erro:
        e.code === 'ER_DUP_ENTRY'
          ? 'E-mail já cadastrado.'
          : 'Não foi possível cadastrar.',
    });
  }
});

app.get('/api/ponto/:id', async (req, res) => {
  const data = req.query.data || hoje();
  const [[f]] = await db.execute(
    'SELECT id,nome,carga_horaria_diaria_minutos FROM funcionarios WHERE id=? AND ativo=1',
    [req.params.id],
  );
  if (!f) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  const [[r]] = await db.execute(
    'SELECT * FROM registros_ponto WHERE funcionario_id=? AND data_referencia=?',
    [f.id, data],
  );
  const registro = r || Object.fromEntries(campos.map((c) => [c, null]));

  res.json({
    funcionario: f,
    data,
    registro,
    resumo: calcular(registro, f.carga_horaria_diaria_minutos),
  });
});

app.post('/api/ponto/:id/bater', async (req, res) => {
  const data = hoje();
  const id = Number(req.params.id);
  const [[f]] = await db.execute(
    'SELECT * FROM funcionarios WHERE id=? AND ativo=1',
    [id],
  );
  if (!f) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  let [[r]] = await db.execute(
    'SELECT * FROM registros_ponto WHERE funcionario_id=? AND data_referencia=?',
    [id, data],
  );
  const i = r ? campos.findIndex((c) => !r[c]) : 0;
  if (i < 0) {
    return res
      .status(409)
      .json({ erro: 'Todas as marcações de hoje já foram feitas.' });
  }
  if (!dentroDaJanela(f, i)) {
    return res.status(403).json({
      erro: `A janela de 1 hora para ${rotulos[i]} expirou ou ainda não abriu. Solicite ajuste ao administrador.`,
    });
  }

  if (!r) {
    await db.execute(
      'INSERT INTO registros_ponto(funcionario_id,data_referencia,entrada) VALUES(?,?,NOW())',
      [id, data],
    );
  } else {
    await db.execute(
      `UPDATE registros_ponto SET ${campos[i]}=NOW() WHERE id=?`,
      [r.id],
    );
  }

  [[r]] = await db.execute(
    'SELECT * FROM registros_ponto WHERE funcionario_id=? AND data_referencia=?',
    [id, data],
  );
  res.json({
    mensagem: `${rotulos[i]} registrada.`,
    registro: r,
    resumo: calcular(r, f.carga_horaria_diaria_minutos),
  });
});

app.post(
  '/api/justificativas/:id',
  upload.single('comprovante'),
  async (req, res) => {
    const { observacao = '' } = req.body;
    if (!observacao.trim() || !req.file) {
      return res
        .status(400)
        .json({ erro: 'Escreva a justificativa e anexe um PDF.' });
    }

    await db.execute(
      'INSERT INTO justificativas(funcionario_id,data_referencia,observacao,arquivo_pdf) VALUES(?,?,?,?)',
      [
        req.params.id,
        hoje(),
        observacao.trim(),
        `/uploads/${req.file.filename}`,
      ],
    );
    res.status(201).json({ mensagem: 'Justificativa enviada para análise.' });
  },
);

app.get('/api/admin/justificativas', async (_q, res) => {
  const [r] = await db.query(
    'SELECT j.*,f.nome FROM justificativas j JOIN funcionarios f ON f.id=j.funcionario_id ORDER BY j.criado_em DESC',
  );
  res.json(r);
});

app.patch('/api/admin/justificativas/:id', async (req, res) => {
  const { status, observacaoAdmin = '' } = req.body;
  if (!['aprovada', 'recusada'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  await db.execute(
    'UPDATE justificativas SET status=?,observacao_admin=? WHERE id=?',
    [status, observacaoAdmin, req.params.id],
  );
  res.json({ mensagem: 'Análise salva.' });
});

app.post('/api/admin/ocorrencias', async (req, res) => {
  const { funcionarioId, data, observacao } = req.body;
  if (!funcionarioId || !data || !observacao) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  await db.execute(
    'INSERT INTO ocorrencias_admin(funcionario_id,data_referencia,observacao) VALUES(?,?,?)',
    [funcionarioId, data, observacao],
  );
  res.status(201).json({ mensagem: 'Ocorrência registrada.' });
});

app.get('/api/relatorio/:id/pdf', async (req, res) => {
  const data = req.query.data || hoje();
  const [[r]] = await db.execute(
    'SELECT f.nome,f.email,f.cargo,f.carga_horaria_diaria_minutos,p.* FROM funcionarios f LEFT JOIN registros_ponto p ON p.funcionario_id=f.id AND p.data_referencia=? WHERE f.id=?',
    [data, req.params.id],
  );
  if (!r) return res.status(404).json({ erro: 'Funcionário não encontrado.' });

  const s = calcular(r, r.carga_horaria_diaria_minutos);
  const hora = (v) =>
    v
      ? new Date(v).toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Não registrado';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ponto-${req.params.id}-${data}.pdf`,
  );

  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf
    .fontSize(21)
    .fillColor('#123a5b')
    .text('Planair Viagens — Espelho de Ponto')
    .moveDown();
  pdf
    .fillColor('black')
    .fontSize(12)
    .text(`Funcionário: ${r.nome}`)
    .text(`Cargo: ${r.cargo || '-'}`)
    .text(`Data: ${new Date(data + 'T12:00').toLocaleDateString('pt-BR')}`)
    .moveDown();
  campos.forEach((c, i) => pdf.text(`${rotulos[i]}: ${hora(r[c])}`));
  pdf
    .moveDown()
    .fontSize(13)
    .text(`Carga diária prevista: ${hhmm(s.meta)}`)
    .text(
      `Horas trabalhadas: ${s.completo ? hhmm(s.trabalhados) : 'Aguardando registros'}`,
    )
    .text(
      `Saldo do dia: ${s.completo ? hhmm(s.saldo) : 'Aguardando registros'}`,
    );
  pdf.end();
});

app.use((err, _q, res, _n) => {
  console.error(err);
  res.status(500).json({ erro: err.message || 'Erro interno.' });
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Aberto em http://localhost:${process.env.PORT || 3000}`),
);
