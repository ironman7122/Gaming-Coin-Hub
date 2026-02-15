(function() {
  if (!AgentData.isLoggedIn()) {
    location.href = 'agent-login.html';
    return;
  }

  var siteData = typeof AdminData !== 'undefined' ? AdminData.loadSiteData() : (typeof SITE_DATA !== 'undefined' ? SITE_DATA : {});
  var defaultRates = [];
  if (typeof AdminData !== 'undefined' && AdminData.getDefaultGameRates) {
    defaultRates = AdminData.getDefaultGameRates();
  }
  if (!defaultRates.length && siteData.gameRates && siteData.gameRates.length) defaultRates = siteData.gameRates;
  if (!defaultRates.length && typeof SITE_DATA !== 'undefined' && SITE_DATA.gameRates && SITE_DATA.gameRates.length) defaultRates = SITE_DATA.gameRates;
  if (!defaultRates.length && typeof window !== 'undefined' && window.__GCH_DEFAULT_GAME_RATES && window.__GCH_DEFAULT_GAME_RATES.length) defaultRates = window.__GCH_DEFAULT_GAME_RATES;
  var agentId = AgentData.getAgentId();
  var customRates = AgentData.getGameRatesForAgent(agentId);
  var gameRates = (function() {
    var base = defaultRates;
    if (!customRates || customRates.length === 0) {
      base = defaultRates;
    } else {
      var byName = {};
      defaultRates.forEach(function(r) { byName[r.name] = JSON.parse(JSON.stringify(r)); });
      customRates.forEach(function(r) {
        if (!r.name) return;
        var def = defaultRates.find(function(x) { return x.name === r.name; }) || {};
        var d = def.distributor || def.subdistributor || def.store || {};
        var coin = (r.coin !== undefined && r.coin !== null) ? (parseInt(r.coin, 10) || 0) : (parseInt(d.coin, 10) || 0);
        var rate = parseInt(r.rate, 10) || 0;
        var t = { coin: coin, rate: rate };
        byName[r.name] = { name: r.name, distributor: t, subdistributor: t, store: t };
      });
      base = Object.keys(byName).sort().map(function(k) { return byName[k]; });
    }
    if (base.length === 0) {
      var names = (siteData.gameNames || []).length ? siteData.gameNames : (typeof SITE_DATA !== 'undefined' && SITE_DATA.gameNames ? SITE_DATA.gameNames : []);
      base = names.map(function(n) { return { name: n, distributor: { coin: 1000, rate: 10 }, subdistributor: { coin: 500, rate: 12 }, store: { coin: 500, rate: 15 } }; });
    }
    return base;
  })();

  function updateBalance() {
    var b = AgentData.getBalances();
    var total = b.chime + b.crypto;
    var fmt = '$' + total.toFixed(2);
    var navEl = document.getElementById('nav-balance');
    var mainEl = document.getElementById('balance-amount');
    var chimeEl = document.getElementById('balance-chime');
    var cryptoEl = document.getElementById('balance-crypto');
    if (navEl) navEl.textContent = fmt;
    if (mainEl) mainEl.textContent = fmt;
    if (chimeEl) chimeEl.textContent = '$' + b.chime.toFixed(2);
    if (cryptoEl) cryptoEl.textContent = '$' + b.crypto.toFixed(2);
  }

  function renderNotices() {
    var container = document.getElementById('agent-notices');
    if (!container) return;
    var notices = (typeof AdminData !== 'undefined' && AdminData.loadAgentNotices) ? AdminData.loadAgentNotices() : [];
    if (notices.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = '';
    var typeClass = { info: 'notice-info border-l-4', warning: 'notice-warning border-l-4', urgent: 'notice-urgent border-l-4' };
    container.innerHTML = notices.slice(0, 5).map(function(n) {
      var cls = typeClass[n.type] || typeClass.info;
      return '<div class="rounded-lg p-4 ' + cls + '"><p class="text-slate-200 text-sm">' + (n.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p></div>';
    }).join('');
  }

  function renderTx() {
    var txs = AgentData.getTransactions();
    var myId = AgentData.getAgentId();
    txs = txs.filter(function(t) { return t.agentId === myId || (!t.agentId && myId === 'agent'); });
    var tbody = document.getElementById('tx-body');
    if (!tbody) return;
    if (txs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No transactions yet</td></tr>';
      return;
    }
    tbody.innerHTML = txs.map(function(t) {
      var time = t.time ? new Date(t.time).toLocaleString() : '—';
      var type = t.type === 'topup' ? 'Top Up' : 'Purchase';
      var details = t.type === 'topup' ? (t.method + (t.ref ? ' • ' + t.ref : '')) : (t.game + ' • ' + (t.tier || '—') + ' • ' + (t.username || '—') + ' • ' + t.coins + ' coins · ' + (t.paymentMethod === 'crypto' ? 'Crypto (10% off)' : 'Chime'));
      var amt = t.amount;
      var amtStr = (amt >= 0 ? '+' : '') + '$' + Math.abs(amt).toFixed(2);
      var amtClass = amt >= 0 ? 'text-green-400' : 'text-red-400';
      return '<tr class="border-b border-white/5 hover:bg-white/[0.04] transition-colors"><td class="px-6 py-3 text-slate-400 text-xs">' + time + '</td><td class="px-6 py-3"><span class="inline-flex px-2 py-0.5 rounded text-xs font-medium ' + (type === 'Purchase' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400') + '">' + type + '</span></td><td class="px-6 py-3 text-slate-300">' + details + '</td><td class="px-6 py-3 text-right font-medium ' + amtClass + '">' + amtStr + '</td></tr>';
    }).join('');
  }

  document.getElementById('logout-btn').addEventListener('click', function() {
    AgentData.logout();
    location.href = 'agent-login.html';
  });

  updateBalance();
  renderTx();
  renderNotices();

  // Tab switching: Dashboard, API, My Games, Rates, Settings
  function showPanel(panel) {
    ['dashboard', 'api', 'games', 'rates', 'settings'].forEach(function(p) {
      var el = document.getElementById('panel-' + p);
      if (el) el.classList.toggle('hidden', p !== panel);
    });
    document.querySelectorAll('.agent-tab').forEach(function(t) {
      t.classList.toggle('text-yellow-400', t.getAttribute('data-panel') === panel);
      t.classList.toggle('text-slate-400', t.getAttribute('data-panel') !== panel);
    });
    if (panel === 'games') { renderGamesTiers(); renderRemainingGames(); }
    if (panel === 'api') renderApiDocs();
    if (panel === 'rates') renderAgentRates();
  }
  document.querySelectorAll('.agent-tab').forEach(function(t) {
    t.addEventListener('click', function(e) {
      e.preventDefault();
      var p = t.getAttribute('data-panel');
      if (p) { window.location.hash = p; showPanel(p); }
    });
  });
  var hash = (window.location.hash || '#dashboard').slice(1);
  showPanel(['games', 'settings', 'api', 'rates', 'dashboard'].indexOf(hash) >= 0 ? hash : 'dashboard');
  window.addEventListener('hashchange', function() {
    var h = (window.location.hash || '#dashboard').slice(1);
    if (['games', 'settings', 'api', 'rates', 'dashboard'].indexOf(h) >= 0) showPanel(h);
  });

  function renderApiDocs() {
    var docs = (typeof AdminData !== 'undefined' && AdminData.loadApiDocs) ? AdminData.loadApiDocs() : [];
    var listEl = document.getElementById('agent-api-docs-list');
    var emptyEl = document.getElementById('agent-api-docs-empty');
    if (!listEl || !emptyEl) return;
    function downloadDoc(d) {
      if (d.fileData) {
        var a = document.createElement('a');
        a.href = d.fileData;
        a.download = d.fileName || 'document.pdf';
        a.click();
      } else if (d.fileUrl) {
        window.open(d.fileUrl, '_blank', 'noopener');
      }
    }
    if (docs.length === 0) {
      listEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
    } else {
      listEl.classList.remove('hidden');
      emptyEl.classList.add('hidden');
      listEl.innerHTML = docs.map(function(d) {
        return '<div class="glass-panel rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/5"><div class="flex-1"><p class="text-yellow-400/80 text-xs font-medium mb-1">' + (d.category || '').replace(/</g, '&lt;') + '</p><h3 class="text-white font-semibold mb-1">' + (d.name || '').replace(/</g, '&lt;') + '</h3><p class="text-slate-400 text-sm">' + (d.description || 'API documentation').replace(/</g, '&lt;') + '</p></div><button type="button" class="api-dl-btn px-4 py-2 bg-yellow-400 text-[#0E0E11] rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 shrink-0" data-id="' + (d.id || '').replace(/"/g, '&quot;') + '"><iconify-icon icon="solar:download-linear"></iconify-icon> Download</button></div>';
      }).join('');
      listEl.querySelectorAll('.api-dl-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.getAttribute('data-id');
          var d = docs.find(function(x) { return x.id === id; });
          if (d) downloadDoc(d);
        });
      });
    }
  }

  function renderGamesTiers() {
    var list = AgentData.getGameUsernameTiers ? AgentData.getGameUsernameTiers() : [];
    var tbody = document.getElementById('games-tiers-body');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500">No game usernames yet. Make a purchase on the Dashboard to see them here.</td></tr>';
      return;
    }
    var tierLabel = { distributor: 'Distributor', subdistributor: 'Sub-distributor', store: 'Store' };
    tbody.innerHTML = list.map(function(r) {
      var tier = tierLabel[r.tier] || r.tier || '—';
      return '<tr class="border-b border-white/5 hover:bg-white/[0.04] transition-colors"><td class="px-6 py-3 text-white font-medium">' + (r.game || '—').replace(/</g, '&lt;') + '</td><td class="px-6 py-3 text-slate-300">' + (r.username || '—').replace(/</g, '&lt;') + '</td><td class="px-6 py-3"><span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/20 text-yellow-400">' + tier + '</span></td></tr>';
    }).join('');
  }

  function renderRemainingGames() {
    var loaded = {};
    var list = AgentData.getGameUsernameTiers ? AgentData.getGameUsernameTiers() : [];
    list.forEach(function(r) { loaded[(r.game || '').toLowerCase()] = true; });
    var remaining = gameRates.filter(function(r) { return !loaded[(r.name || '').toLowerCase()]; });
    var tbody = document.getElementById('games-remaining-body');
    if (!tbody) return;
    if (remaining.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-8 text-center text-slate-500">All games have been loaded. Great job!</td></tr>';
      return;
    }
    tbody.innerHTML = remaining.map(function(r) {
      return '<tr class="border-b border-white/5 hover:bg-white/[0.04] transition-colors"><td class="px-6 py-3 text-white font-medium">' + (r.name || '—').replace(/</g, '&lt;') + '</td><td class="px-6 py-3"><span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-400">Available</span></td></tr>';
    }).join('');
  }

  function renderAgentRates() {
    var tbody = document.getElementById('agent-rates-body');
    if (!tbody) return;
    var tierLabel = { distributor: 'Distributor', subdistributor: 'Sub-distributor', store: 'Store' };
    function fmtTier(t) {
      if (!t || (t.coin === 0 && t.rate === 0)) return '<span class="text-slate-600">—</span>';
      var coin = t.coin || 0;
      var rate = t.rate || 0;
      return '<span class="text-slate-300">' + coin + ' coins</span> <span class="text-yellow-400">@ ' + rate + '%</span>';
    }
    if (gameRates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No rates available. Contact admin.</td></tr>';
      return;
    }
    tbody.innerHTML = gameRates.map(function(r) {
      var d = r.distributor || {};
      var sd = r.subdistributor || {};
      var st = r.store || {};
      return '<tr class="border-b border-white/5 hover:bg-white/[0.04] transition-colors"><td class="px-6 py-3 text-white font-medium">' + (r.name || '—').replace(/</g, '&lt;') + '</td><td class="px-6 py-3 text-sm">' + fmtTier(d) + '</td><td class="px-6 py-3 text-sm">' + fmtTier(sd) + '</td><td class="px-6 py-3 text-sm">' + fmtTier(st) + '</td></tr>';
    }).join('');
  }

  // 2FA UI
  (function init2FA() {
    var statusEnabled = document.getElementById('2fa-enabled-msg');
    var statusDisabled = document.getElementById('2fa-disabled-msg');
    var setupDiv = document.getElementById('2fa-setup');
    var enableBtn = document.getElementById('2fa-enable-btn');
    var disableBtn = document.getElementById('2fa-disable-btn');
    var confirmBtn = document.getElementById('2fa-confirm-btn');
    var cancelBtn = document.getElementById('2fa-cancel-btn');
    var qrContainer = document.getElementById('2fa-qr-container');
    var secretInput = document.getElementById('2fa-secret');
    var verifyInput = document.getElementById('2fa-verify-code');
    var setupMsg = document.getElementById('2fa-setup-msg');
    var faMsg = document.getElementById('2fa-msg');
    var myId = AgentData.getAgentId();
    var pendingSecret = null;

    function update2FAStatus() {
      var enabled = AgentData.is2FAEnabled && AgentData.is2FAEnabled(myId);
      if (myId === 'agent' || !myId) {
        if (enableBtn) enableBtn.classList.add('hidden');
        if (disableBtn) disableBtn.classList.add('hidden');
        if (statusDisabled) statusDisabled.textContent = '2FA is not available for demo account.';
        return;
      }
      if (statusEnabled) statusEnabled.classList.toggle('hidden', !enabled);
      if (statusDisabled) statusDisabled.classList.toggle('hidden', enabled);
      if (enableBtn) enableBtn.classList.toggle('hidden', enabled);
      if (disableBtn) disableBtn.classList.toggle('hidden', !enabled);
      if (setupDiv) setupDiv.classList.add('hidden');
      pendingSecret = null;
    }

    function show2FASetup() {
      if (!AgentData.generate2FASecret || !window.otplib) return;
      var secret = AgentData.generate2FASecret();
      if (!secret) return;
      pendingSecret = secret;
      if (secretInput) secretInput.value = secret;
      if (qrContainer) {
        qrContainer.innerHTML = '';
        var uri = AgentData.get2FAKeyUri(myId, secret);
        if (typeof QRCode !== 'undefined') {
          try { new QRCode(qrContainer, { text: uri, width: 160, height: 160 }); } catch (e) {}
        }
      }
      if (verifyInput) verifyInput.value = '';
      if (setupMsg) { setupMsg.classList.add('hidden'); setupMsg.textContent = ''; }
      if (setupDiv) setupDiv.classList.remove('hidden');
    }

    function hide2FASetup() {
      pendingSecret = null;
      if (setupDiv) setupDiv.classList.add('hidden');
      if (qrContainer) qrContainer.innerHTML = '';
      update2FAStatus();
    }

    if (enableBtn) enableBtn.addEventListener('click', function() { show2FASetup(); });
    if (cancelBtn) cancelBtn.addEventListener('click', function() { hide2FASetup(); });
    if (confirmBtn) confirmBtn.addEventListener('click', function() {
      var code = verifyInput ? verifyInput.value.trim() : '';
      if (!code || code.length !== 6) {
        if (setupMsg) { setupMsg.textContent = 'Enter the 6-digit code from your app.'; setupMsg.className = 'text-sm text-amber-400'; setupMsg.classList.remove('hidden'); }
        return;
      }
      var result = AgentData.enable2FA && AgentData.enable2FA(myId, pendingSecret, code);
      if (result && result.ok) {
        if (faMsg) { faMsg.textContent = '2FA enabled successfully.'; faMsg.className = 'text-sm text-green-400 mt-2'; faMsg.classList.remove('hidden'); }
        hide2FASetup();
        update2FAStatus();
        setTimeout(function() { if (faMsg) faMsg.classList.add('hidden'); }, 3000);
      } else {
        if (setupMsg) { setupMsg.textContent = result && result.msg ? result.msg : 'Invalid code. Try again.'; setupMsg.className = 'text-sm text-red-400'; setupMsg.classList.remove('hidden'); }
      }
    });
    if (disableBtn) disableBtn.addEventListener('click', function() {
      if (!confirm('Disable 2FA? Your account will be less secure.')) return;
      if (AgentData.disable2FA && AgentData.disable2FA(myId)) {
        if (faMsg) { faMsg.textContent = '2FA disabled.'; faMsg.className = 'text-sm text-slate-400 mt-2'; faMsg.classList.remove('hidden'); }
        update2FAStatus();
        setTimeout(function() { if (faMsg) faMsg.classList.add('hidden'); }, 3000);
      }
    });

    update2FAStatus();
  })();

  var settingsForm = document.getElementById('settings-password-form');
  if (settingsForm) settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var current = document.getElementById('settings-current-pw').value;
    var newPw = document.getElementById('settings-new-pw').value;
    var confirmPw = document.getElementById('settings-confirm-pw').value;
    var msgEl = document.getElementById('settings-msg');
    if (newPw !== confirmPw) {
      msgEl.textContent = 'New password and confirm do not match.';
      msgEl.className = 'text-sm text-red-400';
      msgEl.classList.remove('hidden');
      return;
    }
    var result = AgentData.updatePassword ? AgentData.updatePassword(current, newPw) : { ok: false, msg: 'Not available.' };
    msgEl.textContent = result.msg || (result.ok ? 'Password updated.' : 'Failed.');
    msgEl.className = 'text-sm ' + (result.ok ? 'text-green-400' : 'text-red-400');
    msgEl.classList.remove('hidden');
    if (result.ok) {
      document.getElementById('settings-password-form').reset();
      setTimeout(function() { msgEl.classList.add('hidden'); }, 3000);
    }
  });

  // Line graph with date filter
  function getGraphRange() {
    var fromEl = document.getElementById('graph-from');
    var toEl = document.getElementById('graph-to');
    var from = fromEl && fromEl.value ? new Date(fromEl.value) : null;
    var to = toEl && toEl.value ? new Date(toEl.value + 'T23:59:59') : null;
    if (!from || !to) {
      var now = new Date();
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      from = new Date(to);
      from.setMonth(from.getMonth() - 12);
    }
    return { from: from, to: to };
  }

  function setGraphRange(from, to) {
    var fromEl = document.getElementById('graph-from');
    var toEl = document.getElementById('graph-to');
    if (fromEl) fromEl.value = from.toISOString().slice(0, 10);
    if (toEl) toEl.value = to.toISOString().slice(0, 10);
  }

  function applyPreset(days) {
    var to = new Date();
    var from = new Date(to);
    from.setDate(from.getDate() - days);
    setGraphRange(from, to);
    [7, 30, 90, 365].forEach(function(d) {
      var btn = document.getElementById('graph-preset-' + d);
      if (btn) btn.classList.toggle('bg-yellow-400/25 text-yellow-400', d === days);
      if (btn) btn.classList.toggle('bg-white/5 text-slate-400', d !== days);
    });
    renderMonthlyGraph();
  }

  function renderMonthlyGraph() {
    var txs = AgentData.getTransactions().filter(function(t) { return t.type === 'purchase'; });
    var range = getGraphRange();
    var from = range.from.getTime();
    var to = range.to.getTime();
    var dayMs = 24 * 60 * 60 * 1000;
    var daysDiff = Math.ceil((to - from) / dayMs) || 1;
    var byDay = daysDiff <= 62;
    var buckets = {};
    var d = new Date(range.from);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() <= range.to) {
      var k = byDay ? d.toISOString().slice(0, 10) : (d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
      buckets[k] = { total: 0, label: byDay ? ((d.getMonth() + 1) + '/' + d.getDate()) : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) };
      if (byDay) d.setDate(d.getDate() + 1);
      else d.setMonth(d.getMonth() + 1);
    }
    txs.forEach(function(t) {
      if (!t.time) return;
      var ts = new Date(t.time).getTime();
      if (ts < from || ts > to) return;
      var dt = new Date(ts);
      var k = byDay ? dt.toISOString().slice(0, 10) : (dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'));
      if (buckets[k]) buckets[k].total += Math.abs(t.amount || 0);
    });
    var keys = Object.keys(buckets).sort();
    var maxVal = 1;
    keys.forEach(function(k) { if (buckets[k].total > maxVal) maxVal = buckets[k].total; });
    var graphEl = document.getElementById('monthly-graph');
    var legendEl = document.getElementById('monthly-graph-legend');
    if (!graphEl) return;
    var w = Math.max(graphEl.offsetWidth || 400, 300);
    var h = 200;
    var pad = { top: 8, right: 8, bottom: 24, left: 36 };
    var plotW = w - pad.left - pad.right;
    var plotH = h - pad.top - pad.bottom;
    var pts = keys.map(function(k, i) {
      var v = buckets[k].total;
      var x = pad.left + (keys.length > 1 ? (i / (keys.length - 1)) * plotW : plotW / 2);
      var y = pad.top + plotH - (maxVal > 0 ? (v / maxVal) * plotH : 0);
      return { x: Math.round(x), y: Math.round(y), v: v, label: buckets[k].label };
    });
    var pathD = pts.length ? ('M' + pts.map(function(p) { return p.x + ',' + p.y; }).join(' L')) : '';
    var totalSpent = keys.reduce(function(s, k) { return s + buckets[k].total; }, 0);
    var fillPath = pts.length ? (pathD + ' L' + pts[pts.length - 1].x + ',' + (pad.top + plotH) + ' L' + pts[0].x + ',' + (pad.top + plotH) + ' Z') : '';
    graphEl.innerHTML = '<svg width="100%" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" class="overflow-visible"><defs><linearGradient id="gch-line-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(250,204,21)" stop-opacity="0.3"/><stop offset="100%" stop-color="rgb(250,204,21)" stop-opacity="0"/></linearGradient></defs>' + (fillPath ? '<path d="' + fillPath + '" fill="url(#gch-line-fill)"/>' : '') + (pathD ? '<path d="' + pathD + '" fill="none" stroke="rgb(250,204,21)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : '') + pts.map(function(p) { return '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="rgb(250,204,21)"/>'; }).join('') + '</svg>';
    if (legendEl) legendEl.innerHTML = 'Total: <span class="text-yellow-400 font-medium">$' + totalSpent.toFixed(2) + '</span>';
  }

  (function initGraph() {
    var to = new Date();
    var from = new Date(to);
    from.setMonth(from.getMonth() - 12);
    setGraphRange(from, to);
    var fromEl = document.getElementById('graph-from');
    var toEl = document.getElementById('graph-to');
    function clearPresetActive() {
      [7, 30, 90, 365].forEach(function(d) {
        var btn = document.getElementById('graph-preset-' + d);
        if (btn) { btn.classList.remove('bg-yellow-400/25', 'text-yellow-400'); btn.classList.add('bg-white/5', 'text-slate-400'); }
      });
    }
    if (fromEl) fromEl.addEventListener('change', function() { clearPresetActive(); renderMonthlyGraph(); });
    if (toEl) toEl.addEventListener('change', function() { clearPresetActive(); renderMonthlyGraph(); });
    [7, 30, 90, 365].forEach(function(days) {
      var btn = document.getElementById('graph-preset-' + days);
      if (btn) btn.addEventListener('click', function() { applyPreset(days); });
    });
    applyPreset(365);
  })();

  // Buy form - custom game dropdown (reliable across all browsers)
  (function initGameDropdown() {
    var btn = document.getElementById('buy-game-btn');
    var list = document.getElementById('buy-game-list');
    var input = document.getElementById('buy-game');
    var label = document.getElementById('buy-game-label');
    if (!btn || !list || !input) return;
    list.innerHTML = '';
    var placeholder = gameRates.length ? '— Select game —' : '— No games configured —';
    label.textContent = placeholder;
    if (gameRates.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'px-3 py-4 text-sm text-slate-500 text-center';
      empty.textContent = 'No games configured. Contact admin.';
      list.appendChild(empty);
    }
    gameRates.forEach(function(r) {
      var name = r.name || '—';
      var el = document.createElement('div');
      el.className = 'game-opt px-3 py-2.5 text-sm text-white border-b border-white/5 last:border-b-0';
      el.textContent = name;
      el.setAttribute('data-value', name);
      el.addEventListener('click', function() {
        input.value = name;
        label.textContent = name;
        list.classList.add('hidden');
        if (typeof updateTotal === 'function') updateTotal();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      list.appendChild(el);
    });
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      list.classList.toggle('hidden');
      if (!list.classList.contains('hidden')) list.querySelector('.game-opt') && list.querySelector('.game-opt').scrollIntoView({ block: 'nearest' });
    });
    document.addEventListener('click', function(e) {
      var wrap = document.getElementById('buy-game-wrap');
      if (wrap && !wrap.contains(e.target)) list.classList.add('hidden');
    });
  })();

  function getSavedUsernames() {
    var txs = AgentData.getTransactions();
    var myId = AgentData.getAgentId();
    txs = txs.filter(function(t) { return (t.agentId === myId || (!t.agentId && myId === 'agent')) && t.type === 'purchase' && t.username; });
    var seen = {};
    var list = [];
    txs.forEach(function(t) {
      var u = (t.username || '').trim();
      if (u && !seen[u]) { seen[u] = true; list.push(u); }
    });
    return list;
  }

  function refreshUsernameOptions() {
    var sel = document.getElementById('buy-username');
    var newInput = document.getElementById('buy-username-new');
    if (!sel) return;
    var saved = getSavedUsernames();
    sel.innerHTML = '';
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '— Select or add new —';
    sel.appendChild(opt0);
    saved.forEach(function(u) {
      var opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      sel.appendChild(opt);
    });
    var optNew = document.createElement('option');
    optNew.value = '__new__';
    optNew.textContent = '➕ Enter new username…';
    sel.appendChild(optNew);
    if (newInput) newInput.classList.add('hidden');
  }

  function updateUsernameUI() {
    var sel = document.getElementById('buy-username');
    var newInput = document.getElementById('buy-username-new');
    if (!sel || !newInput) return;
    if (sel.value === '__new__') {
      newInput.classList.remove('hidden');
    } else {
      newInput.classList.add('hidden');
    }
  }

  refreshUsernameOptions();
  document.getElementById('buy-username').addEventListener('change', function() {
    updateUsernameUI();
    var sel = document.getElementById('buy-username');
    var tierSel = document.getElementById('buy-tier');
    if (sel.value && sel.value !== '__new__') {
      var game = document.getElementById('buy-game').value;
      var existingTier = AgentData.getExistingTierForGameUsername(game, sel.value);
      if (existingTier && tierSel && tierSel.querySelector('option[value="' + existingTier + '"]')) {
        tierSel.value = existingTier;
        updateTotal();
      }
    }
  });

  function getGameRate(gameName) {
    var r = gameRates.find(function(x) { return x.name === gameName; });
    if (!r) return null;
    var tierKey = document.getElementById('buy-tier').value;
    var t = r[tierKey] || r.distributor || {};
    return t && (t.coin > 0 || t.rate > 0) ? t : null;
  }

  function updateTotal() {
    var game = document.getElementById('buy-game').value;
    var coins = parseInt(document.getElementById('buy-coins').value, 10) || 0;
    var t = getGameRate(game);
    var rate = t ? (parseInt(t.rate, 10) || 0) : 0;
    var price = (coins * rate) / 100;
    var method = document.getElementById('buy-payment-method').value;
    var discount = method === 'crypto' ? price * 0.1 : 0;
    var finalPrice = price - discount;
    document.getElementById('buy-total').textContent = '$' + finalPrice.toFixed(2);
    var note = document.getElementById('buy-discount-note');
    if (method === 'crypto' && price > 0) {
      note.textContent = '10% crypto discount applied (was $' + price.toFixed(2) + ')';
      note.classList.remove('hidden');
    } else {
      note.classList.add('hidden');
    }
    var avail = AgentData.getBalanceByMethod(method);
    if (finalPrice > 0 && avail < finalPrice) {
      var lowEl = document.getElementById('buy-low-balance');
      if (lowEl) { lowEl.textContent = 'Insufficient ' + (method === 'crypto' ? 'crypto' : 'Chime') + ' balance ($' + avail.toFixed(2) + ')'; lowEl.classList.remove('hidden'); }
    } else {
      var lowEl = document.getElementById('buy-low-balance');
      if (lowEl) lowEl.classList.add('hidden');
    }
  }

  document.getElementById('buy-game').addEventListener('change', function() {
    updateTotal();
    var sel = document.getElementById('buy-username');
    var tierSel = document.getElementById('buy-tier');
    if (sel && sel.value && sel.value !== '__new__') {
      var game = document.getElementById('buy-game').value;
      var existingTier = AgentData.getExistingTierForGameUsername(game, sel.value);
      if (existingTier && tierSel && tierSel.querySelector('option[value="' + existingTier + '"]')) {
        tierSel.value = existingTier;
        updateTotal();
      }
    }
  });
  document.getElementById('buy-tier').addEventListener('change', updateTotal);
  document.getElementById('buy-coins').addEventListener('input', updateTotal);
  document.getElementById('buy-coins').addEventListener('change', updateTotal);
  document.getElementById('buy-payment-method').addEventListener('change', updateTotal);
  updateTotal();

  document.getElementById('buy-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var game = document.getElementById('buy-game').value;
    var tier = document.getElementById('buy-tier').value;
    var selVal = document.getElementById('buy-username').value;
    var username = (selVal === '__new__' ? (document.getElementById('buy-username-new').value || '') : selVal).trim();
    var coins = parseInt(document.getElementById('buy-coins').value, 10) || 0;
    var t = getGameRate(game);
    if (!t || coins < 1) { alert('Select a game and enter a valid coin amount.'); return; }
    if (!username) { alert('Enter the game username for coin delivery.'); return; }
    var existingTier = AgentData.getExistingTierForGameUsername(game, username);
    if (existingTier && existingTier !== tier) {
      var tierLabel = { distributor: 'Distributor', subdistributor: 'Sub-distributor', store: 'Store' }[existingTier] || existingTier;
      alert('Username "' + username + '" was already loaded at ' + tierLabel + ' level for ' + game + '. You can only load this username at the same level. Please select tier: ' + tierLabel);
      return;
    }
    var rate = parseInt(t.rate, 10) || 0;
    var price = (coins * rate) / 100;
    var method = document.getElementById('buy-payment-method').value;
    var discount = method === 'crypto' ? price * 0.1 : 0;
    var finalPrice = price - discount;
    var methodLabel = method === 'crypto' ? 'crypto' : 'Chime';
    var btn = document.getElementById('buy-btn');
    btn.disabled = true;
    var payload = { game: game, coins: coins, tier: tier, amount: finalPrice, paymentMethod: method, username: username };
    var apiDone = function(ok) {
      btn.disabled = false;
      if (!ok) return;
      if (AgentData.deductBalance(finalPrice, game, coins, tier, method, username)) {
        try { sessionStorage.setItem('gch_last_order', JSON.stringify({ game: game, coins: coins, tier: tier, username: username, amount: finalPrice })); } catch (e) {}
        updateBalance();
        renderTx();
        renderMonthlyGraph();
        renderNotices();
        refreshUsernameOptions();
        document.getElementById('buy-form').reset();
        document.getElementById('buy-username-new').value = '';
        document.getElementById('buy-username-new').classList.add('hidden');
        var gl = document.getElementById('buy-game-label');
        if (gl) gl.textContent = gameRates.length ? '— Select game —' : '— No games configured —';
        var glist = document.getElementById('buy-game-list');
        if (glist) glist.classList.add('hidden');
        updateTotal();
        location.href = 'agent-order-thank-you.html';
      } else {
        alert('Insufficient ' + methodLabel + ' balance. Top up first.');
      }
    };
    if (typeof window.PurchaseAPI !== 'undefined' && typeof window.PurchaseAPI.processPurchase === 'function') {
      window.PurchaseAPI.processPurchase(payload).then(function(result) { apiDone(result !== false); }).catch(function() { apiDone(true); });
    } else {
      apiDone(true);
    }
  });
})();
