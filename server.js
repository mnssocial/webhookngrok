const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Banco de dados em memória (em produção, use MongoDB, PostgreSQL, etc.)
let webhooks = []; // Lista de webhooks cadastrados
let webhookIdCounter = 1;
let eventIdCounter = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// ==================== ROTAS DO DASHBOARD ====================

// Rota principal - Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página de detalhes de um webhook específico
app.get('/webhook/:webhookId/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'webhook-detail.html'));
});

// ==================== API - CRUD DE WEBHOOKS ====================

// Listar todos os webhooks
app.get('/api/webhooks', (req, res) => {
  const webhooksWithStats = webhooks.map(webhook => ({
    ...webhook,
    eventCount: webhook.events.length,
    lastEvent: webhook.events[0]?.timestamp || null
  }));

  res.json({
    total: webhooks.length,
    webhooks: webhooksWithStats
  });
});

// Buscar um webhook específico
app.get('/api/webhooks/:id', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.id));
  if (webhook) {
    res.json(webhook);
  } else {
    res.status(404).json({ error: 'Webhook não encontrado' });
  }
});

// Criar novo webhook
app.post('/api/webhooks', (req, res) => {
  const { name, description, application } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  // Gerar um ID único para o webhook
  const uniqueId = crypto.randomBytes(16).toString('hex');

  const webhook = {
    id: webhookIdCounter++,
    uniqueId: uniqueId,
    name: name,
    description: description || '',
    application: application || '',
    url: `/w/${uniqueId}`,
    createdAt: new Date().toISOString(),
    active: true,
    events: []
  };

  webhooks.push(webhook);

  console.log(`✅ Webhook criado: ${webhook.name} (${webhook.url})`);

  res.status(201).json(webhook);
});

// Atualizar webhook
app.put('/api/webhooks/:id', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.id));

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  const { name, description, application, active } = req.body;

  if (name) webhook.name = name;
  if (description !== undefined) webhook.description = description;
  if (application !== undefined) webhook.application = application;
  if (active !== undefined) webhook.active = active;

  webhook.updatedAt = new Date().toISOString();

  res.json(webhook);
});

// Deletar webhook
app.delete('/api/webhooks/:id', (req, res) => {
  const index = webhooks.findIndex(w => w.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  const deleted = webhooks.splice(index, 1)[0];
  console.log(`🗑️ Webhook deletado: ${deleted.name}`);

  res.json({ success: true, message: 'Webhook deletado com sucesso' });
});

// ==================== API - EVENTOS DE UM WEBHOOK ====================

// Buscar eventos de um webhook específico
app.get('/api/webhooks/:id/events', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.id));

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  res.json({
    total: webhook.events.length,
    events: webhook.events
  });
});

// Limpar eventos de um webhook
app.delete('/api/webhooks/:id/events', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.id));

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  const count = webhook.events.length;
  webhook.events = [];

  res.json({
    success: true,
    message: `${count} eventos removidos`
  });
});

// Deletar um evento específico
app.delete('/api/webhooks/:webhookId/events/:eventId', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.webhookId));

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  const eventIndex = webhook.events.findIndex(e => e.id === parseInt(req.params.eventId));

  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Evento não encontrado' });
  }

  webhook.events.splice(eventIndex, 1);

  res.json({ success: true, message: 'Evento removido' });
});

// ==================== RECEBER WEBHOOKS ====================

// Endpoint dinâmico para receber webhooks (/w/:uniqueId)
app.all('/w/:uniqueId', (req, res) => {
  const { uniqueId } = req.params;

  // Buscar o webhook pelo uniqueId
  const webhook = webhooks.find(w => w.uniqueId === uniqueId);

  if (!webhook) {
    return res.status(404).json({
      error: 'Webhook não encontrado',
      message: 'Este webhook não existe ou foi removido'
    });
  }

  if (!webhook.active) {
    return res.status(403).json({
      error: 'Webhook inativo',
      message: 'Este webhook está desativado'
    });
  }

  // Criar evento
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

  // Adicionar evento ao webhook
  webhook.events.unshift(event);

  // Limitar a 100 eventos por webhook
  if (webhook.events.length > 100) {
    webhook.events = webhook.events.slice(0, 100);
  }

  console.log(`📥 Evento recebido [${event.method}] para webhook: ${webhook.name} - Event ID: ${event.id}`);

  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    webhook: webhook.name,
    eventId: event.id
  });
});

// Server-Sent Events para atualizações em tempo real de um webhook específico
app.get('/api/webhooks/:id/stream', (req, res) => {
  const webhook = webhooks.find(w => w.id === parseInt(req.params.id));

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook não encontrado' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar ping a cada 30 segundos
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  let lastEventCount = webhook.events.length;

  // Verificar novos eventos a cada segundo
  const checkInterval = setInterval(() => {
    if (webhook.events.length > lastEventCount) {
      const newEvents = webhook.events.slice(0, webhook.events.length - lastEventCount);
      res.write(`data: ${JSON.stringify(newEvents)}\n\n`);
      lastEventCount = webhook.events.length;
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(pingInterval);
    clearInterval(checkInterval);
  });
});

// ==================== ESTATÍSTICAS ====================

app.get('/api/stats', (req, res) => {
  const totalWebhooks = webhooks.length;
  const totalEvents = webhooks.reduce((sum, webhook) => sum + webhook.events.length, 0);
  const activeWebhooks = webhooks.filter(w => w.active).length;

  res.json({
    totalWebhooks,
    totalEvents,
    activeWebhooks,
    inactiveWebhooks: totalWebhooks - activeWebhooks
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Webhook Management System Started!       ║
╚════════════════════════════════════════════════╝

📍 Local:    http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}
🔧 API Docs:  http://localhost:${PORT}/api/webhooks

🔧 Para expor publicamente, execute:
   ngrok http ${PORT}

✨ Sistema pronto para gerenciar webhooks!
  `);
});
