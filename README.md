# 🔥 Webhook Manager - Developer Console

Sistema profissional de gerenciamento de webhooks com interface estilo VS Code. Seu próprio webhook.site sem limites!

## ✨ Características

- 🎨 **Interface VS Code Dark Theme**: Visual profissional de editor de código
- 📡 **CRUD Completo**: Crie, edite, pause e delete webhooks
- ⚡ **Tempo Real**: Atualização automática via Server-Sent Events
- 🔍 **Syntax Highlighting**: JSON colorido com highlight.js
- 📋 **Copy Everywhere**: Botões de copiar em todas as seções
- 🎯 **Zero Limites**: Sem restrições de requisições
- 🌐 **Ngrok Integration**: Exponha publicamente em segundos
- 💻 **Split-Screen**: Sidebar com eventos + painel de detalhes

## 🚀 Início Rápido (1 Comando!)

### Opção 1: Rodar TUDO automaticamente
```bash
npm start
```

### Opção 2: Com auto-reload (desenvolvimento)
```bash
npm run dev
```

Pronto! Acesse: **http://localhost:3000**

---

## 📦 Instalação Completa

### 1. Instalar dependências
```bash
npm install
```

### 2. (Opcional) Instalar ngrok
```bash
brew install ngrok
```

### 3. (Opcional) Configurar ngrok
```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

## 🎯 Como Usar

### 1. Iniciar o servidor
```bash
npm start
```

O servidor irá iniciar na porta 3000.

### 2. Acessar o Dashboard
Abra no navegador: http://localhost:3000

### 3. Expor publicamente com ngrok
Em outro terminal, execute:
```bash
ngrok http 3000
```

Você receberá uma URL pública como:
```
https://lacresha-skintight-cody.ngrok-free.dev
```

### 4. Usar o Webhook
Agora você pode enviar requisições para:
- **Local**: `http://localhost:3000/webhook`
- **Público (ngrok)**: `https://sua-url.ngrok-free.dev/webhook`

## 📍 Endpoints Disponíveis

### Webhook Endpoints (recebem eventos)
- `POST /webhook` - Endpoint principal
- `GET /webhook` - Aceita qualquer método HTTP
- `/webhook/*` - Aceita paths customizados (ex: `/webhook/payment`, `/webhook/order`)

### API Endpoints (para o dashboard)
- `GET /api/events` - Lista todos os eventos
- `GET /api/events/:id` - Busca um evento específico
- `DELETE /api/events/:id` - Deleta um evento
- `DELETE /api/events` - Limpa todos os eventos
- `GET /api/stream` - Server-Sent Events para atualizações em tempo real

## 🧪 Testando Webhooks

### Usando curl
```bash
# POST simples
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Olá Webhook!"}'

# GET com query params
curl "http://localhost:3000/webhook?usuario=lucas&acao=teste"

# PUT com headers customizados
curl -X PUT http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Custom-Header: MeuValor" \
  -d '{"status": "atualizado"}'
```

### Usando webhook.site
Você também pode testar redirecionando requests de webhook.site para seu ngrok URL.

## 📊 Recursos do Dashboard

- **Visualização em Cards**: Cada evento aparece em um card estilizado
- **Código de Cores**: Métodos HTTP com cores diferentes
- **Detalhes Expandíveis**: Clique em "Ver Detalhes" para expandir
- **Copiar URL**: Botão para copiar a URL do webhook
- **Atualização Automática**: Novos eventos aparecem automaticamente
- **Timestamps**: Mostra quando cada evento foi recebido
- **Gerenciamento**: Delete eventos ou limpe tudo

## 🎨 Personalização

### Mudar a porta
Edite o arquivo [server.js](server.js) linha 8:
```javascript
const PORT = 3000; // Mude para sua porta preferida
```

### Aumentar limite de eventos
Edite [server.js](server.js) linha 38:
```javascript
if (webhookEvents.length > 100) { // Mude de 100 para o valor desejado
```

## 🔧 Desenvolvimento

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📝 Estrutura do Projeto

```
webhookngrok/
├── server.js           # Servidor Express
├── package.json        # Dependências
├── README.md          # Documentação
├── public/
│   └── index.html     # Dashboard HTML
└── logica.md          # Notas
```

## 🌟 Exemplos de Uso

### Integração com APIs de Pagamento
Configure o webhook URL no seu provedor de pagamento (Stripe, PayPal, etc.) usando a URL do ngrok.

### Notificações de Sistemas
Configure sistemas externos para enviar notificações para seu webhook.

### Testes de Integração
Use para testar fluxos de integração durante o desenvolvimento.

## 💡 Dicas

1. **Mantenha o ngrok rodando**: O ngrok precisa estar ativo para receber webhooks externos
2. **URL dinâmica**: A URL do ngrok muda quando você reinicia (use domínio fixo no plano pago)
3. **Logs no terminal**: Eventos também aparecem no console do servidor
4. **Limite de eventos**: Por padrão, mantém últimos 100 eventos em memória

## 🐛 Troubleshooting

### Porta já em uso
Se a porta 3000 estiver em uso, mude a porta no `server.js` e reinicie o ngrok:
```bash
ngrok http NOVA_PORTA
```

### Ngrok não conecta
Verifique se o authtoken foi configurado corretamente:
```bash
ngrok config check
```

### Dashboard não atualiza
Verifique se o JavaScript está habilitado no navegador e se não há erros no console.

## 📄 Licença

ISC

---

Desenvolvido com ❤️ para facilitar o desenvolvimento com webhooks!
