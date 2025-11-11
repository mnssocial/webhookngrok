const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Armazenar eventos recebidos (em produção, use um banco de dados)
let webhookEvents = [];
let eventIdCounter = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota principal - Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para receber webhooks (aceita todos os métodos HTTP)
app.all('/webhook', (req, res) => {
  const event = {
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    rawBody: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    ip: req.ip || req.connection.remoteAddress
  };

  webhookEvents.unshift(event); // Adiciona no início do array

  // Limitar a 100 eventos na memória
  if (webhookEvents.length > 100) {
    webhookEvents = webhookEvents.slice(0, 100);
  }

  console.log(`📥 Webhook recebido [${event.method}] - ID: ${event.id}`);

  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    eventId: event.id
  });
});

// Rota customizada para receber webhooks com path dinâmico
app.all('/webhook/*', (req, res) => {
  const event = {
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    rawBody: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    ip: req.ip || req.connection.remoteAddress
  };

  webhookEvents.unshift(event);

  if (webhookEvents.length > 100) {
    webhookEvents = webhookEvents.slice(0, 100);
  }

  console.log(`📥 Webhook recebido [${event.method}] ${event.path} - ID: ${event.id}`);

  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    eventId: event.id
  });
});

// API para buscar eventos
app.get('/api/events', (req, res) => {
  res.json({
    total: webhookEvents.length,
    events: webhookEvents
  });
});

// API para buscar um evento específico
app.get('/api/events/:id', (req, res) => {
  const event = webhookEvents.find(e => e.id === parseInt(req.params.id));
  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ error: 'Evento não encontrado' });
  }
});

// API para limpar todos os eventos
app.delete('/api/events', (req, res) => {
  const count = webhookEvents.length;
  webhookEvents = [];
  eventIdCounter = 1;
  res.json({
    success: true,
    message: `${count} eventos removidos`
  });
});

// API para deletar um evento específico
app.delete('/api/events/:id', (req, res) => {
  const index = webhookEvents.findIndex(e => e.id === parseInt(req.params.id));
  if (index !== -1) {
    webhookEvents.splice(index, 1);
    res.json({ success: true, message: 'Evento removido' });
  } else {
    res.status(404).json({ error: 'Evento não encontrado' });
  }
});

// Server-Sent Events para atualizações em tempo real
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar ping a cada 30 segundos para manter conexão viva
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  // Armazenar a quantidade atual de eventos
  let lastEventCount = webhookEvents.length;

  // Verificar novos eventos a cada segundo
  const checkInterval = setInterval(() => {
    if (webhookEvents.length > lastEventCount) {
      const newEvents = webhookEvents.slice(0, webhookEvents.length - lastEventCount);
      res.write(`data: ${JSON.stringify(newEvents)}\n\n`);
      lastEventCount = webhookEvents.length;
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(pingInterval);
    clearInterval(checkInterval);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Servidor Webhook Dashboard Iniciado!     ║
╚════════════════════════════════════════════════╝

📍 Local:    http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}
📥 Webhook:   http://localhost:${PORT}/webhook

🔧 Para expor publicamente, execute:
   ngrok http ${PORT}

✨ Aguardando eventos...
  `);
});
