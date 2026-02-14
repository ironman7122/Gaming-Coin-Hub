// Agent auth and balance - localStorage based (demo/static)
// Payment methods: chime | crypto. API integration: see PAYMENT_API_HOOK below.
(function() {
  var AGENT_AUTH = 'gch_agent_auth';
  var AGENT_BALANCE = 'gch_agent_balance';
  var AGENT_TX = 'gch_agent_transactions';
  var AGENTS_KEY = 'gch_agents';
  var AGENT_RATES_KEY = 'gch_agent_rates';
  var RESET_TOKENS_KEY = 'gch_reset_tokens';
  var AGENT_2FA_KEY = 'gch_agent_2fa';
  var AGENT_ID = 'agent';
  var AGENT_PW = 'Agent123';
  var PAYMENT_METHODS = { CHIME: 'chime', CRYPTO: 'crypto' };

  function getAgents() {
    try {
      var stored = localStorage.getItem(AGENTS_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function getAgentId() {
    try {
      var s = sessionStorage.getItem(AGENT_AUTH);
      if (s) return s;
    } catch (e) {}
    return null;
  }

  function setAgentAuth(id) {
    sessionStorage.setItem(AGENT_AUTH, id);
  }

  function clearAgentAuth() {
    sessionStorage.removeItem(AGENT_AUTH);
  }

  function registerAgent(email, password) {
    var em = (email || '').trim().toLowerCase();
    if (!em || !password) return { ok: false, msg: 'Email and password required.' };
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(em)) return { ok: false, msg: 'Enter a valid email address.' };
    if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
    var agents = getAgents();
    if (agents.some(function(x) { return (x.id || '').toLowerCase() === em; })) return { ok: false, msg: 'This email is already registered.' };
    agents.push({ id: em, email: em, password: password, name: em });
    try {
      localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
      setAgentAuth(em);
      return { ok: true };
    } catch (e) { return { ok: false, msg: 'Could not save. Try again.' }; }
  }

  function login(id, pw) {
    var agents = getAgents();
    if (agents.length > 0) {
      var a = agents.find(function(x) { return (x.id || '').toLowerCase() === (id || '').toLowerCase(); });
      if (a && a.password === pw) {
        if (is2FAEnabled(a.id)) return { needs2FA: true, agentId: a.id };
        setAgentAuth(a.id);
        return { ok: true };
      }
      return { ok: false };
    }
    if (id === AGENT_ID && pw === AGENT_PW) {
      setAgentAuth(id);
      return { ok: true };
    }
    return { ok: false };
  }

  function loginWith2FA(agentId, code) {
    if (!agentId || !code || code.length !== 6) return false;
    if (!verify2FACode(agentId, code)) return false;
    setAgentAuth(agentId);
    return true;
  }

  function is2FAEnabled(agentId) {
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_2FA_KEY) || '{}');
      var entry = data[agentId];
      return !!(entry && entry.enabled);
    } catch (e) {}
    return false;
  }

  function get2FASecret(agentId) {
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_2FA_KEY) || '{}');
      var entry = data[agentId];
      return entry ? entry.secret : null;
    } catch (e) {}
    return null;
  }

  function totpCheck(code, secret) {
    var auth = window.otplib && window.otplib.authenticator;
    if (!auth) return false;
    try {
      if (typeof auth.check === 'function') return auth.check(code, secret);
      if (typeof auth.verify === 'function') return auth.verify({ token: code, secret: secret });
      if (auth.verify && auth.verify.valid) return auth.verify({ token: code, secret: secret }).valid;
    } catch (e) {}
    return false;
  }

  function verify2FACode(agentId, code) {
    var secret = get2FASecret(agentId);
    if (!secret) return false;
    return totpCheck(code, secret);
  }

  function generate2FASecret() {
    try {
      var auth = window.otplib && window.otplib.authenticator;
      if (auth && typeof auth.generateSecret === 'function') return auth.generateSecret();
    } catch (e) {}
    return null;
  }

  function get2FAKeyUri(accountName, secret) {
    try {
      var auth = window.otplib && window.otplib.authenticator;
      if (auth) {
        if (typeof auth.keyuri === 'function') return auth.keyuri(accountName, 'Gaming Coin Hub', secret);
        if (typeof auth.generateURI === 'function') return auth.generateURI(accountName, 'Gaming Coin Hub', secret);
      }
    } catch (e) {}
    return 'otpauth://totp/Gaming%20Coin%20Hub:' + encodeURIComponent(accountName || '') + '?secret=' + (secret || '');
  }

  function enable2FA(agentId, secret, code) {
    if (!verify2FACodeWithSecret(secret, code)) return { ok: false, msg: 'Invalid code. Try again.' };
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_2FA_KEY) || '{}');
      data[agentId] = { secret: secret, enabled: true };
      localStorage.setItem(AGENT_2FA_KEY, JSON.stringify(data));
      return { ok: true };
    } catch (e) {}
    return { ok: false, msg: 'Could not save.' };
  }

  function verify2FACodeWithSecret(secret, code) {
    return totpCheck(code, secret);
  }

  function disable2FA(agentId) {
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_2FA_KEY) || '{}');
      delete data[agentId];
      localStorage.setItem(AGENT_2FA_KEY, JSON.stringify(data));
      return true;
    } catch (e) {}
    return false;
  }

  function requestPasswordReset(email) {
    var em = (email || '').trim().toLowerCase();
    var agents = getAgents();
    var a = agents.find(function(x) { return (x.id || '').toLowerCase() === em; });
    if (!a) return { ok: true, msg: 'If this email is registered, you will receive reset instructions.' };
    var token = Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    try {
      var data = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}');
      data[token] = { email: em, expires: Date.now() + 30 * 60 * 1000 };
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(data));
      return { ok: true, msg: 'If this email is registered, you will receive reset instructions.', token: token };
    } catch (e) {}
    return { ok: false, msg: 'Could not process. Try again.' };
  }

  function resetPasswordWithToken(token, newPassword) {
    try {
      var data = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}');
      var entry = data[token];
      if (!entry || entry.expires < Date.now()) return { ok: false, msg: 'Link expired or invalid.' };
      var em = entry.email;
      var agents = getAgents();
      var a = agents.find(function(x) { return (x.id || '').toLowerCase() === em; });
      if (!a) return { ok: false, msg: 'Account not found.' };
      if (!newPassword || newPassword.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
      a.password = newPassword;
      localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
      delete data[token];
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(data));
      return { ok: true };
    } catch (e) {}
    return { ok: false, msg: 'Could not reset. Try again.' };
  }

  function getResetUrl(token) {
    var base = window.location.origin + window.location.pathname.replace(/[^/]+$/, '');
    return base + 'agent-reset-password.html?token=' + encodeURIComponent(token);
  }

  function getBalances() {
    var aid = getAgentId();
    if (!aid) return { chime: 0, crypto: 0 };
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_BALANCE) || '{}');
      var b = data[aid];
      if (typeof b === 'number') return { chime: b, crypto: 0 };
      if (b && typeof b === 'object') return { chime: parseFloat(b.chime) || 0, crypto: parseFloat(b.crypto) || 0 };
      return { chime: 0, crypto: 0 };
    } catch (e) {}
    return { chime: 0, crypto: 0 };
  }

  function setBalance(method, amount) {
    var aid = getAgentId();
    if (!aid) return;
    var key = method === PAYMENT_METHODS.CRYPTO ? 'crypto' : 'chime';
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_BALANCE) || '{}');
      var b = data[aid];
      if (typeof b === 'number') b = { chime: b, crypto: 0 };
      if (!b || typeof b !== 'object') b = { chime: 0, crypto: 0 };
      b[key] = Math.max(0, parseFloat(amount) || 0);
      data[aid] = b;
      localStorage.setItem(AGENT_BALANCE, JSON.stringify(data));
    } catch (e) {}
  }

  function getBalance() {
    var b = getBalances();
    return b.chime + b.crypto;
  }

  function getBalanceByMethod(method) {
    var b = getBalances();
    return method === PAYMENT_METHODS.CRYPTO ? b.crypto : b.chime;
  }

  function addBalance(amount, method, ref) {
    var bal = getBalances();
    var amt = parseFloat(amount) || 0;
    var key = method === PAYMENT_METHODS.CRYPTO ? 'crypto' : 'chime';
    var newVal = (key === 'crypto' ? bal.crypto : bal.chime) + amt;
    setBalance(method, newVal);
    var aid = getAgentId();
    addTx({ type: 'topup', amount: amount, method: method, ref: ref || '', balanceAfter: getBalance(), agentId: aid || '' });
    if (typeof window.PAYMENT_API_HOOK === 'function') window.PAYMENT_API_HOOK('credit', { method: method, amount: amt, ref: ref });
  }

  function creditAgentBalance(agentId, method, amount, ref) {
    if (!agentId || !method) return false;
    var amt = parseFloat(amount) || 0;
    if (amt <= 0) return false;
    var key = method === PAYMENT_METHODS.CRYPTO ? 'crypto' : 'chime';
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_BALANCE) || '{}');
      var b = data[agentId];
      if (typeof b === 'number') b = { chime: b, crypto: 0 };
      if (!b || typeof b !== 'object') b = { chime: 0, crypto: 0 };
      b[key] = (parseFloat(b[key]) || 0) + amt;
      data[agentId] = b;
      localStorage.setItem(AGENT_BALANCE, JSON.stringify(data));
      var list = JSON.parse(localStorage.getItem(AGENT_TX) || '[]');
      list.unshift({ type: 'topup', amount: amt, method: method, ref: ref || 'Admin credit', agentId: agentId, time: new Date().toISOString(), id: Date.now() + '-' + Math.random().toString(36).slice(2, 9) });
      if (list.length > 100) list = list.slice(0, 100);
      localStorage.setItem(AGENT_TX, JSON.stringify(list));
      return true;
    } catch (e) { return false; }
  }

  function getAgentBalances(agentId) {
    if (!agentId) return { chime: 0, crypto: 0 };
    try {
      var data = JSON.parse(localStorage.getItem(AGENT_BALANCE) || '{}');
      var b = data[agentId];
      if (typeof b === 'number') return { chime: b, crypto: 0 };
      if (b && typeof b === 'object') return { chime: parseFloat(b.chime) || 0, crypto: parseFloat(b.crypto) || 0 };
    } catch (e) {}
    return { chime: 0, crypto: 0 };
  }

  function deductBalance(amount, game, coins, tier, paymentMethod, username) {
    var method = paymentMethod === PAYMENT_METHODS.CRYPTO ? PAYMENT_METHODS.CRYPTO : PAYMENT_METHODS.CHIME;
    var bal = getBalances();
    var amt = parseFloat(amount) || 0;
    var available = method === PAYMENT_METHODS.CRYPTO ? bal.crypto : bal.chime;
    if (available < amt) return false;
    var newVal = available - amt;
    setBalance(method, newVal);
    var aid = getAgentId();
    var tx = { type: 'purchase', amount: -amt, game: game, coins: coins, tier: tier, paymentMethod: method, username: username || '', balanceAfter: getBalance(), agentId: aid || '' };
    addTx(tx);
    if (typeof window.PAYMENT_API_HOOK === 'function') window.PAYMENT_API_HOOK('debit', { method: method, amount: amt, game: game, coins: coins, username: username });
    return true;
  }

  function addTx(tx) {
    tx.time = new Date().toISOString();
    tx.id = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    try {
      var list = JSON.parse(localStorage.getItem(AGENT_TX) || '[]');
      list.unshift(tx);
      if (list.length > 100) list = list.slice(0, 100);
      localStorage.setItem(AGENT_TX, JSON.stringify(list));
    } catch (e) {}
  }

  function getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(AGENT_TX) || '[]');
    } catch (e) {}
    return [];
  }

  /** Returns the tier of the first successful purchase for this game+username by the current agent, or null if never used. */
  function getExistingTierForGameUsername(game, username) {
    var aid = getAgentId();
    var txs = getTransactions();
    var u = (username || '').trim().toLowerCase();
    var g = (game || '').trim();
    if (!u || !g) return null;
    for (var i = 0; i < txs.length; i++) {
      var t = txs[i];
      if (t.type !== 'purchase') continue;
      if ((t.agentId !== aid) && !(t.agentId === '' && aid === 'agent')) continue;
      if ((t.game || '').trim() !== g) continue;
      if ((t.username || '').trim().toLowerCase() !== u) continue;
      return t.tier || null;
    }
    return null;
  }

  function updatePassword(currentPassword, newPassword) {
    var aid = getAgentId();
    if (!aid) return { ok: false, msg: 'Not logged in.' };
    if (aid === AGENT_ID) return { ok: false, msg: 'Demo account cannot change password.' };
    if (!newPassword || newPassword.length < 6) return { ok: false, msg: 'New password must be at least 6 characters.' };
    var agents = getAgents();
    var a = agents.find(function(x) { return (x.id || '').toLowerCase() === aid.toLowerCase(); });
    if (!a) return { ok: false, msg: 'Agent not found.' };
    if (a.password !== currentPassword) return { ok: false, msg: 'Current password is incorrect.' };
    a.password = newPassword;
    try {
      localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
      return { ok: true };
    } catch (e) { return { ok: false, msg: 'Could not save.' }; }
  }

  /** Returns unique game+username+tier from agent's purchase history. */
  function getGameUsernameTiers() {
    var aid = getAgentId();
    var txs = getTransactions().filter(function(t) {
      return t.type === 'purchase' && (t.agentId === aid || (!t.agentId && aid === 'agent'));
    });
    var seen = {};
    var list = [];
    txs.forEach(function(t) {
      var g = (t.game || '').trim();
      var u = (t.username || '').trim();
      var tier = t.tier || '—';
      if (!g || !u) return;
      var key = g.toLowerCase() + '|' + u.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      list.push({ game: g, username: u, tier: tier });
    });
    return list.sort(function(a, b) {
      if (a.game !== b.game) return a.game.localeCompare(b.game);
      return a.username.localeCompare(b.username);
    });
  }

  function getGameRatesForAgent(agentId) {
    if (!agentId) return null;
    try {
      var stored = localStorage.getItem(AGENT_RATES_KEY);
      if (!stored) return null;
      var ratesByAgent = JSON.parse(stored);
      var rates = ratesByAgent[agentId];
      return rates && Array.isArray(rates) ? rates : null;
    } catch (e) {}
    return null;
  }

  window.AgentData = {
    login: login,
    loginWith2FA: loginWith2FA,
    registerAgent: registerAgent,
    logout: clearAgentAuth,
    isLoggedIn: function() { return !!getAgentId(); },
    getAgentId: getAgentId,
    is2FAEnabled: is2FAEnabled,
    get2FASecret: get2FASecret,
    generate2FASecret: generate2FASecret,
    get2FAKeyUri: get2FAKeyUri,
    enable2FA: enable2FA,
    disable2FA: disable2FA,
    verify2FACodeWithSecret: verify2FACodeWithSecret,
    requestPasswordReset: requestPasswordReset,
    resetPasswordWithToken: resetPasswordWithToken,
    getResetUrl: getResetUrl,
    getBalance: getBalance,
    getBalances: getBalances,
    getBalanceByMethod: getBalanceByMethod,
    addBalance: addBalance,
    deductBalance: deductBalance,
    creditAgentBalance: creditAgentBalance,
    getAgentBalances: getAgentBalances,
    getTransactions: getTransactions,
    getExistingTierForGameUsername: getExistingTierForGameUsername,
    updatePassword: updatePassword,
    getGameUsernameTiers: getGameUsernameTiers,
    getGameRatesForAgent: getGameRatesForAgent,
    PAYMENT_METHODS: PAYMENT_METHODS,
    AGENT_ID: AGENT_ID,
    AGENT_PW: AGENT_PW
  };
})();
