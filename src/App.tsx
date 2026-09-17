import { useState } from 'react';
import { Shield, Send, Lock, Unlock, FileJson, Server, Key, AlertCircle, CheckCircle2, Loader2, Copy } from 'lucide-react';

interface RequestConfig {
  method: string;
  url: string;
  headers: string;
  body: string;
  encryptBody: boolean;
  decryptResponse: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  encryptedBody?: string;
  oauthHeader?: string;
  timing: number;
}

function App() {
  const [config, setConfig] = useState<RequestConfig>({
    method: 'POST',
    url: 'https://sandbox.api.mastercard.com/global-processing/core/v1/authorizations',
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '{\n  "transactionAmount": {\n    "value": 100.00,\n    "currencyCode": "840"\n  },\n  "merchantId": "MERCHANT123",\n  "stan": "123456"\n}',
    encryptBody: true,
    decryptResponse: true,
  });

  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'response'>('body');

  const BACKEND_URL = 'http://localhost:3001';

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const startTime = Date.now();
      
      const res = await fetch(`${BACKEND_URL}/api/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: config.method,
          url: config.url,
          headers: config.headers ? JSON.parse(config.headers) : {},
          body: config.body ? JSON.parse(config.body) : null,
          encryptBody: config.encryptBody,
          decryptResponse: config.decryptResponse,
        }),
      });

      const data = await res.json();
      const timing = Date.now() - startTime;

      if (data.error) {
        setError(data.error);
      } else {
        setResponse({
          status: data.status,
          statusText: data.statusText,
          headers: data.headers || {},
          body: data.decryptedBody || data.body || '',
          encryptedBody: data.encryptedBody,
          oauthHeader: data.oauthHeader,
          timing,
        });
      }
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch')) {
        setError('Não foi possível conectar ao backend. Certifique-se de que o servidor Node.js está a correr em http://localhost:3001');
      } else {
        setError(err.message || 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBg = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-emerald-500/10 border-emerald-500/30';
    if (status >= 300 && status < 400) return 'bg-yellow-500/10 border-yellow-500/30';
    if (status >= 400 && status < 500) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Mastercard API Tester</h1>
              <p className="text-xs text-slate-400">Processing Core • OAuth 1.0a • JWE Encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Sandbox
            </span>
            <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300 border border-slate-600">
              Backend: :3001
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Connection Info */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Instruções:</strong> Este frontend comunica com o backend Node.js (Express) em{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 text-xs">{BACKEND_URL}</code>.
                O backend trata da encriptação JWE, assinatura OAuth 1.0a e desencriptação da resposta.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Certifique-se de ter o servidor a correr com <code className="text-slate-400">node server.js</code> na pasta <code className="text-slate-400">backend/</code>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Request */}
          <div className="space-y-4">
            {/* Method & URL */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Endpoint URL</label>
              <div className="flex gap-2">
                <select
                  value={config.method}
                  onChange={(e) => setConfig({ ...config, method: e.target.value })}
                  className="px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://sandbox.api.mastercard.com/..."
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('body')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'body'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <FileJson className="w-4 h-4" />
                Request Body
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'headers'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Key className="w-4 h-4" />
                Headers
              </button>
            </div>

            {/* Body / Headers Content */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
              {activeTab === 'body' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">JSON Body</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.encryptBody}
                          onChange={(e) => setConfig({ ...config, encryptBody: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                        />
                        <Lock className="w-3 h-3" />
                        Encriptar JWE
                      </label>
                      <button
                        onClick={() => copyToClipboard(config.body)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={config.body}
                    onChange={(e) => setConfig({ ...config, body: e.target.value })}
                    rows={14}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}

              {activeTab === 'headers' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Headers Adicionais (JSON)</span>
                    <button
                      onClick={() => copyToClipboard(config.headers)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={config.headers}
                    onChange={(e) => setConfig({ ...config, headers: e.target.value })}
                    rows={14}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder='{"X-Custom-Header": "value"}'
                  />
                </div>
              )}
            </div>

            {/* Options & Send */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.encryptBody}
                      onChange={(e) => setConfig({ ...config, encryptBody: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <Lock className="w-4 h-4 text-amber-400" />
                    Encriptar Body (JWE)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.decryptResponse}
                      onChange={(e) => setConfig({ ...config, decryptResponse: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    Desencriptar Resposta
                  </label>
                </div>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? 'A enviar...' : 'Enviar Request'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Response */}
          <div className="space-y-4">
            {/* Response Status */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300">Response</h3>
                {response && (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBg(response.status)} ${getStatusColor(response.status)}`}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-xs text-slate-500">{response.timing}ms</span>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              )}

              {/* Empty State */}
              {!response && !error && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Send className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Envie um request para ver a resposta</p>
                </div>
              )}
            </div>

            {/* OAuth Header */}
            {response?.oauthHeader && (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">OAuth Authorization Header</h4>
                  <button
                    onClick={() => copyToClipboard(response.oauthHeader!)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="text-xs font-mono text-amber-300 bg-slate-900/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {response.oauthHeader}
                </pre>
              </div>
            )}

            {/* Response Body */}
            {response && (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">Body Desencriptado</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2))}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono text-slate-200 overflow-auto max-h-96 whitespace-pre-wrap">
                  {typeof response.body === 'string'
                    ? (() => {
                        try {
                          return JSON.stringify(JSON.parse(response.body), null, 2);
                        } catch {
                          return response.body;
                        }
                      })()
                    : JSON.stringify(response.body, null, 2)}
                </pre>
              </div>
            )}

            {/* Encrypted Body (raw) */}
            {response?.encryptedBody && (
              <div className="rounded-xl bg-slate-800/50 border border-amber-500/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">Body Encriptado (JWE Raw)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(response.encryptedBody!)}
                    className="text-amber-500 hover:text-amber-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-amber-200/80 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {response.encryptedBody}
                </pre>
              </div>
            )}

            {/* Response Headers */}
            {response && Object.keys(response.headers).length > 0 && (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-800/80">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Response Headers</h4>
                </div>
                <div className="p-4 max-h-48 overflow-auto">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 py-1 border-b border-slate-800 last:border-0">
                      <span className="text-xs font-mono text-blue-300 min-w-[140px]">{key}:</span>
                      <span className="text-xs font-mono text-slate-400 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-slate-400">OAuth 1.0a com RSA-SHA256</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-slate-400">JWE Payload Encryption</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Unlock className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-400">Response Auto-Decryption</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
