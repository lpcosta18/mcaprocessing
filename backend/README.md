# Mastercard API Tester 🛡️

Uma aplicação web local para testar chamadas à API **Mastercard Processing Core** com suporte completo para:
- **OAuth 1.0a** (assinatura de requests com RSA-SHA256)
- **JWE** (encriptação/desencriptação de payloads)

## 📁 Estrutura do Projeto

```
├── src/                    # Frontend React (Vite)
│   ├── App.tsx            # Interface do API Tester
│   ├── main.tsx           # Entry point React
│   └── index.css          # Estilos Tailwind
├── backend/               # Backend Node.js (Express)
│   ├── server.js          # Servidor Express com lógica MC
│   ├── package.json       # Dependências do backend
│   ├── .env.example       # Template de configuração
│   ├── keys/              # Pasta para as chaves (criar manualmente)
│   │   ├── signing-key.p12
│   │   ├── client-encryption.pem
│   │   └── decryption-key.p12
│   └── README.md          # Este ficheiro
├── index.html             # HTML principal (Vite)
├── package.json           # Dependências do frontend
└── vite.config.js         # Configuração Vite
```

## 🚀 Como Iniciar

### 1. Configurar o Backend

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Copiar o template de configuração
cp .env.example .env

# Editar o .env com os seus dados
# (ver secção "Configuração" abaixo)
```

### 2. Colocar as Chaves

Crie a pasta `keys/` dentro de `backend/` e coloque os seus ficheiros:

```bash
mkdir -p keys
# Copie os ficheiros obtidos no Mastercard Developer Portal:
# - signing-key.p12 (chave privada de assinatura)
# - client-encryption.pem (certificado público de encriptação)
# - decryption-key.p12 (chave privada de desencriptação)
```

### 3. Iniciar o Backend

```bash
cd backend
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor arranca em `http://localhost:3001`

### 4. Iniciar o Frontend

```bash
# Na raiz do projeto
npm install
npm run dev
```

O frontend arranca em `http://localhost:5173` (ou porta indicada pelo Vite)

## ⚙️ Configuração (.env)

| Variável | Descrição |
|----------|-----------|
| `CONSUMER_KEY` | Consumer Key do seu projeto no MC Developer Portal |
| `SIGNING_KEY_PATH` | Caminho para o PKCS#12 da chave de assinatura |
| `SIGNING_KEY_ALIAS` | Alias da chave dentro do PKCS#12 |
| `SIGNING_KEY_PASSWORD` | Password do PKCS#12 de assinatura |
| `ENCRYPTION_CERT_PATH` | Caminho para o certificado PEM de encriptação |
| `DECRYPTION_KEY_PATH` | Caminho para o PKCS#12 de desencriptação |
| `DECRYPTION_KEY_ALIAS` | Alias da chave de desencriptação |
| `DECRYPTION_KEY_PASSWORD` | Password do PKCS#12 de desencriptação |
| `API_BASE_URL` | URL base (sandbox ou produção) |
| `PORT` | Porta do servidor (default: 3001) |

## 🔐 Fluxo de Funcionamento

```
Frontend (React)          Backend (Express)              Mastercard API
      │                         │                              │
      │  1. POST /api/proxy     │                              │
      │  {method, url, body}    │                              │
      │ ───────────────────────>│                              │
      │                         │                              │
      │                         │  2. JWE Encrypt Body         │
      │                         │  (path: "$", entire payload) │
      │                         │                              │
      │                         │  3. OAuth 1.0a Sign          │
      │                         │  (hash sobre body JWE)       │
      │                         │                              │
      │                         │  4. HTTP Request             │
      │                         │ ────────────────────────────>│
      │                         │                              │
      │                         │  5. HTTP Response            │
      │                         │ <────────────────────────────│
      │                         │                              │
      │                         │  6. JWE Decrypt Response     │
      │                         │                              │
      │  7. Response            │                              │
      │  {status, body, ...}    │                              │
      │ <───────────────────────│                              │
      │                         │                              │
```

### Detalhes Importantes:

1. **Encriptação JWE**: O body inteiro é encriptado usando `path: "$"` e o resultado é colocado num campo `encryptedData`.
2. **OAuth Body Hash**: O `oauth_body_hash` é calculado sobre o **payload JWE encriptado** (não sobre o JSON original). Isto é crítico para a API aceitar o request.
3. **Desencriptação**: A resposta é verificada para conter `encryptedData` ou `encryptedPayload` e desencriptada automaticamente.

## 🧪 Endpoints do Backend

| Endpoint | Method | Descrição |
|----------|--------|-----------|
| `/api/proxy` | POST | Proxy principal para a API Mastercard |
| `/api/health` | GET | Health check e status da configuração |
| `/api/test-keys` | GET | Testa se as chaves são carregadas corretamente |

## 📝 Exemplos de Uso

### Exemplo 1: Authorization (POST)

```json
{
  "method": "POST",
  "url": "https://sandbox.api.mastercard.com/global-processing/core/v1/authorizations",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "transactionAmount": {
      "value": 100.00,
      "currencyCode": "840"
    },
    "merchantId": "YOUR_MERCHANT_ID",
    "stan": "123456"
  },
  "encryptBody": true,
  "decryptResponse": true
}
```

### Exemplo 2: GET sem body

```json
{
  "method": "GET",
  "url": "https://sandbox.api.mastercard.com/global-processing/core/v1/authorizations/12345",
  "headers": {},
  "body": null,
  "encryptBody": false,
  "decryptResponse": true
}
```

## ❓ Troubleshooting

### "Ficheiro de chave de assinatura não encontrado"
- Verifique o caminho em `SIGNING_KEY_PATH` no `.env`
- Certifique-se que o ficheiro está na pasta `backend/keys/`

### "CONSUMER_KEY não configurada"
- Adicione a Consumer Key no `.env`
- Obtém-se no [Mastercard Developer Portal](https://developer.mastercard.com/)

### "Erro na encriptação JWE"
- Verifique se o certificado PEM está correto
- Verifique se a chave de desencriptação PKCS#12 existe e a password está correta

### "Erro na assinatura OAuth"
- Verifique se o alias da chave está correto
- Verifique se a password do PKCS#12 está correta
- Teste com `GET /api/test-keys`

## 🔗 Referências

- [Mastercard Developer Portal](https://developer.mastercard.com/)
- [OAuth 1.0a Documentation](https://developer.mastercard.com/platform/documentation/security-and-authentication/using-oauth-1a-to-access-mastercard-apis/)
- [Payload Encryption](https://developer.mastercard.com/platform/documentation/security-and-authentication/securing-sensitive-data-using-payload-encryption/)
- [mastercard-oauth1-signer (npm)](https://www.npmjs.com/package/mastercard-oauth1-signer)
- [mastercard-client-encryption (npm)](https://www.npmjs.com/package/mastercard-client-encryption)
