/**
 * Mastercard API Tester - Backend Server
 * 
 * Este servidor Express recebe requests do frontend e:
 * 1. Encripta o body em formato JWE (se configurado)
 * 2. Assina o request com OAuth 1.0a (usando o body encriptado para o oauth_body_hash)
 * 3. Envia o request para a API Mastercard
 * 4. Desencripta a resposta (se vier encriptada)
 * 5. Devolve o resultado limpo para o frontend
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Mastercard Libraries
const oauth = require('mastercard-oauth1-signer');
const clientEncryption = require('mastercard-client-encryption');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================
// CONFIGURAÇÃO DAS CHAVES
// ============================================

/**
 * Carrega a chave privada de assinatura a partir do ficheiro PKCS#12
 */
function loadSigningKey() {
  const forge = require('node-forge');
  const keyPath = process.env.SIGNING_KEY_PATH || './keys/signing-key.p12';
  const keyPassword = process.env.SIGNING_KEY_PASSWORD || '';
  const keyAlias = process.env.SIGNING_KEY_ALIAS || 'keyalias';

  const absolutePath = path.resolve(keyPath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Ficheiro de chave de assinatura não encontrado: ${absolutePath}`);
  }

  const p12Content = fs.readFileSync(absolutePath, 'binary');
  const p12Asn1 = forge.asn1.fromDer(p12Content, false);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, keyPassword);
  
  const bags = p12.getBags({
    friendlyName: keyAlias,
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag
  });

  if (!bags.friendlyName || bags.friendlyName.length === 0) {
    // Tenta sem alias específico
    const allBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = Object.values(allBags)[0];
    if (!keyBag || keyBag.length === 0) {
      throw new Error('Nenhuma chave privada encontrada no ficheiro PKCS#12');
    }
    return forge.pki.privateKeyToPem(keyBag[0].key);
  }

  const keyObj = bags.friendlyName[0];
  return forge.pki.privateKeyToPem(keyObj.key);
}

/**
 * Carrega a chave privada de desencriptação a partir do ficheiro PKCS#12
 */
function loadDecryptionKeyPath() {
  const keyPath = process.env.DECRYPTION_KEY_PATH || './keys/decryption-key.p12';
  const absolutePath = path.resolve(keyPath);
  
  if (!fs.existsSync(absolutePath)) {
    console.warn(`⚠️  Ficheiro de chave de desencriptação não encontrado: ${absolutePath}`);
    return null;
  }
  
  return absolutePath;
}

// ============================================
// CONFIGURAÇÃO DA ENCRIPTAÇÃO JWE
// ============================================

/**
 * Cria a configuração JWE para encriptação do request
 */
function getJweEncryptionConfig() {
  const certPath = process.env.ENCRYPTION_CERT_PATH || './keys/client-encryption.pem';
  const absoluteCertPath = path.resolve(certPath);

  if (!fs.existsSync(absoluteCertPath)) {
    throw new Error(`Certificado de encriptação não encontrado: ${absoluteCertPath}`);
  }

  return {
    paths: [
      {
        path: '$', // Encripta o body inteiro
        toEncrypt: [
          {
            element: '$',
            obj: '$',
          },
        ],
        toDecrypt: [],
      },
    ],
    mode: 'JWE',
    encryptedValueFieldName: 'encryptedData',
    encryptionCertificate: absoluteCertPath,
    privateKey: loadDecryptionKeyPath(),
  };
}

/**
 * Cria a configuração JWE para desencriptação da resposta
 */
function getJweDecryptionConfig() {
  const certPath = process.env.ENCRYPTION_CERT_PATH || './keys/client-encryption.pem';
  const decryptionKeyPath = loadDecryptionKeyPath();
  const absoluteCertPath = path.resolve(certPath);

  return {
    paths: [
      {
        path: '$', // Desencripta o body inteiro
        toEncrypt: [],
        toDecrypt: [
          {
            element: '$',
            obj: '$',
          },
        ],
      },
    ],
    mode: 'JWE',
    encryptedValueFieldName: 'encryptedData',
    encryptionCertificate: absoluteCertPath,
    privateKey: decryptionKeyPath,
  };
}

// ============================================
// ENDPOINT PRINCIPAL - API PROXY
// ============================================

app.post('/api/proxy', async (req, res) => {
  const { method, url, headers, body, encryptBody, decryptResponse } = req.body;

  console.log('\n========================================');
  console.log(`📡 ${method} ${url}`);
  console.log('========================================');

  try {
    // Validação básica
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    // Carregar a chave de assinatura
    let signingKey;
    try {
      signingKey = loadSigningKey();
    } catch (keyError) {
      return res.status(500).json({
        error: `Erro ao carregar chave de assinatura: ${keyError.message}`,
      });
    }

    const consumerKey = process.env.CONSUMER_KEY;
    if (!consumerKey) {
      return res.status(500).json({
        error: 'CONSUMER_KEY não configurada no .env',
      });
    }

    // Preparar o body
    let payloadToSend = body;
    let encryptedBodyRaw = null;

    // PASSO 1: Encriptar o body em JWE (se configurado)
    if (encryptBody && body && typeof body === 'object') {
      try {
        console.log('🔒 A encriptar body com JWE...');
        const jweConfig = getJweEncryptionConfig();
        const jwe = new clientEncryption.JweEncryption(jweConfig);
        
        // Encriptar o payload inteiro
        const encryptedPayload = jwe.encrypt(url, headers || {}, body);
        
        // O resultado da encriptação de payload inteiro é um objeto com encryptedData
        payloadToSend = encryptedPayload;
        encryptedBodyRaw = typeof encryptedPayload === 'string' 
          ? encryptedPayload 
          : JSON.stringify(encryptedPayload);
        
        console.log('✅ Body encriptado com sucesso');
        console.log(`   Tamanho original: ${JSON.stringify(body).length} bytes`);
        console.log(`   Tamanho encriptado: ${encryptedBodyRaw.length} bytes`);
      } catch (encError) {
        console.error('❌ Erro na encriptação JWE:', encError.message);
        return res.status(500).json({
          error: `Erro na encriptação JWE: ${encError.message}`,
        });
      }
    }

    // PASSO 2: Preparar o payload para o OAuth (o hash é calculado sobre o body encriptado)
    const payloadForOAuth = payloadToSend 
      ? (typeof payloadToSend === 'string' ? payloadToSend : JSON.stringify(payloadToSend))
      : '';

    // PASSO 3: Gerar o header de autorização OAuth 1.0a
    let authHeader;
    try {
      console.log('🔐 A gerar assinatura OAuth 1.0a...');
      authHeader = oauth.getAuthorizationHeader(
        url,
        method,
        payloadForOAuth,
        consumerKey,
        signingKey
      );
      console.log('✅ Assinatura OAuth gerada com sucesso');
    } catch (oauthError) {
      console.error('❌ Erro na assinatura OAuth:', oauthError.message);
      return res.status(500).json({
        error: `Erro na assinatura OAuth: ${oauthError.message}`,
      });
    }

    // PASSO 4: Preparar os headers finais
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
      ...headers,
    };

    // Se o body foi encriptado, garantir que o Content-Type está correto
    if (encryptBody && payloadToSend) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    console.log(`\n📤 A enviar request para: ${url}`);
    console.log(`   Method: ${method}`);
    console.log(`   Body size: ${payloadForOAuth.length} bytes`);

    // PASSO 5: Enviar o request para a API Mastercard
    let apiResponse;
    try {
      apiResponse = await axios({
        method: method.toLowerCase(),
        url: url,
        headers: requestHeaders,
        data: payloadToSend || undefined,
        timeout: 30000,
        validateStatus: () => true, // Não lançar erro para status codes não-2xx
      });
    } catch (httpError) {
      console.error('❌ Erro HTTP:', httpError.message);
      return res.status(502).json({
        error: `Erro ao comunicar com a API Mastercard: ${httpError.message}`,
      });
    }

    console.log(`\n📥 Resposta recebida: ${apiResponse.status} ${apiResponse.statusText}`);

    // PASSO 6: Desencriptar a resposta (se configurado e se vier encriptada)
    let decryptedBody = apiResponse.data;
    let responseBodyStr = typeof apiResponse.data === 'string' 
      ? apiResponse.data 
      : JSON.stringify(apiResponse.data, null, 2);

    if (decryptResponse && apiResponse.data) {
      try {
        // Verificar se a resposta contém dados encriptados
        const responseData = typeof apiResponse.data === 'string' 
          ? JSON.parse(apiResponse.data) 
          : apiResponse.data;

        // A resposta encriptada pode vir como:
        // - Um objeto com "encryptedData" (payload inteiro encriptado)
        // - Um objeto com "encryptedPayload" (padrão alternativo)
        const hasEncryptedData = responseData.encryptedData || responseData.encryptedPayload;

        if (hasEncryptedData) {
          console.log('🔓 A desencriptar resposta...');
          
          // Ajustar o encryptedValueFieldName se necessário
          const decryptionConfig = getJweDecryptionConfig();
          
          if (responseData.encryptedPayload && !responseData.encryptedData) {
            decryptionConfig.encryptedValueFieldName = 'encryptedPayload';
          }

          const jwe = new clientEncryption.JweEncryption(decryptionConfig);
          
          const responseObj = {
            request: { url: url },
            body: responseData,
          };

          decryptedBody = jwe.decrypt(responseObj);
          responseBodyStr = typeof decryptedBody === 'string'
            ? decryptedBody
            : JSON.stringify(decryptedBody, null, 2);
          
          console.log('✅ Resposta desencriptada com sucesso');
        } else {
          console.log('ℹ️  Resposta não parece estar encriptada, a devolver como está');
        }
      } catch (decError) {
        console.warn('⚠️  Erro ao desencriptar resposta:', decError.message);
        console.warn('   A devolver resposta raw...');
        // Se falhar a desencriptação, devolvemos o body raw
        decryptedBody = apiResponse.data;
      }
    }

    // PASSO 7: Devolver o resultado para o frontend
    const result = {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: apiResponse.headers,
      body: responseBodyStr,
      oauthHeader: authHeader,
    };

    // Incluir o body encriptado se aplicável
    if (encryptedBodyRaw) {
      result.encryptedBody = encryptedBodyRaw;
    }

    // Se a resposta foi desencriptada, incluir ambos
    if (decryptResponse && decryptedBody !== apiResponse.data) {
      result.decryptedBody = typeof decryptedBody === 'string'
        ? decryptedBody
        : JSON.stringify(decryptedBody, null, 2);
    }

    console.log('\n✅ Request processado com sucesso');
    console.log('========================================\n');

    res.json(result);

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error.message);
    console.error(error.stack);
    res.status(500).json({
      error: `Erro interno do servidor: ${error.message}`,
    });
  }
});

// ============================================
// ENDPOINT DE HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  const config = {
    consumerKey: process.env.CONSUMER_KEY ? '✅ Configurada' : '❌ Não configurada',
    signingKeyPath: process.env.SIGNING_KEY_PATH || './keys/signing-key.p12',
    encryptionCertPath: process.env.ENCRYPTION_CERT_PATH || './keys/client-encryption.pem',
    decryptionKeyPath: process.env.DECRYPTION_KEY_PATH || './keys/decryption-key.p12',
    apiBaseUrl: process.env.API_BASE_URL || 'https://sandbox.api.mastercard.com',
  };

  // Verificar se os ficheiros existem
  const filesExist = {
    signingKey: fs.existsSync(path.resolve(config.signingKeyPath)),
    encryptionCert: fs.existsSync(path.resolve(config.encryptionCertPath)),
    decryptionKey: config.decryptionKeyPath ? fs.existsSync(path.resolve(config.decryptionKeyPath)) : false,
  };

  res.json({
    status: 'ok',
    config,
    filesExist,
  });
});

// ============================================
// ENDPOINT PARA TESTAR A CARGA DAS CHAVES
// ============================================

app.get('/api/test-keys', (req, res) => {
  try {
    const signingKey = loadSigningKey();
    res.json({
      success: true,
      message: 'Chave de assinatura carregada com sucesso',
      keyLength: signingKey.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     Mastercard API Tester - Backend Server      ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🚀 Server running on: http://localhost:${PORT}     ║`);
  console.log('║                                                  ║');
  console.log('║  Endpoints:                                      ║');
  console.log(`║  • POST /api/proxy     - Proxy para API MC       ║`);
  console.log(`║  • GET  /api/health    - Health check            ║`);
  console.log(`║  • GET  /api/test-keys - Testar chaves           ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Configuração:                                   ║');
  console.log(`║  • Consumer Key: ${process.env.CONSUMER_KEY ? '✅' : '❌'}                           ║`);
  console.log(`║  • Signing Key:  ${fs.existsSync(path.resolve(process.env.SIGNING_KEY_PATH || './keys/signing-key.p12')) ? '✅' : '❌'}                           ║`);
  console.log(`║  • Encrypt Cert: ${fs.existsSync(path.resolve(process.env.ENCRYPTION_CERT_PATH || './keys/client-encryption.pem')) ? '✅' : '❌'}                           ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
});
