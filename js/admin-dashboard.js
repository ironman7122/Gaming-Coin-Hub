(function() {
  var loginSection = document.getElementById('login-section');
  var dashboard = document.getElementById('dashboard');
  var useLocal = (typeof SHEET_SCRIPT_URL === 'undefined' || SHEET_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE');

  function isLoggedIn() { return sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true'; }

  function showUI() {
    if (isLoggedIn()) {
      loginSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      initDashboard();
    } else {
      loginSection.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  }

  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = document.getElementById('adminId').value.trim();
    var pw = document.getElementById('password').value;
    var msg = document.getElementById('login-message');
    var btn = document.getElementById('login-btn');
    if (useLocal) {
      if (id === ADMIN_ID && pw === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        sessionStorage.setItem(ADMIN_PW_KEY, pw);
        showUI();
      } else {
        msg.textContent = 'Invalid ID or password.';
        msg.className = 'py-3 px-4 rounded-lg text-sm bg-red-500/20 text-red-400';
        msg.classList.remove('hidden');
      }
      return;
    }
    btn.disabled = true;
    msg.classList.add('hidden');
    try {
      var res = await fetch(SHEET_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', password: pw }) });
      var data = await res.json();
      if (data.success) {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        sessionStorage.setItem(ADMIN_PW_KEY, pw);
        showUI();
      } else {
        msg.textContent = data.error || 'Invalid password';
        msg.className = 'py-3 px-4 rounded-lg text-sm bg-red-500/20 text-red-400';
        msg.classList.remove('hidden');
      }
    } catch (err) {
      msg.textContent = 'Connection error.';
      msg.className = 'py-3 px-4 rounded-lg text-sm bg-red-500/20 text-red-400';
      msg.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_PW_KEY);
    showUI();
  });

  function showMsg(elId, text, ok) {
    var el = document.getElementById(elId);
    if (el) {
      el.textContent = text;
      el.className = 'ml-3 text-sm ' + (ok ? 'text-green-400' : 'text-red-400');
      el.classList.remove('hidden');
      setTimeout(function() { el.classList.add('hidden'); }, 3000);
    }
    var toast = document.getElementById('toast');
    if (toast && elId && !el) { toast.textContent = text; toast.className = 'fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30'; toast.classList.remove('hidden'); setTimeout(function() { toast.classList.add('hidden'); }, 3000); }
  }

  function initDashboard() {
    var siteData = AdminData.loadSiteData();
    var gamesData = AdminData.loadGamesData();

    // Overview stats
    document.getElementById('stat-games').textContent = gamesData.length;
    document.getElementById('stat-nav').textContent = (siteData.nav || []).length;
    document.getElementById('stat-services').textContent = (siteData.services || []).length;
    document.getElementById('stat-overrides').textContent = AdminData.hasOverrides() ? 'Yes' : 'No';

    // Admin purchases line graph
    function getAdminGraphRange() {
      var fromEl = document.getElementById('admin-graph-from');
      var toEl = document.getElementById('admin-graph-to');
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
    function setAdminGraphRange(from, to) {
      var fromEl = document.getElementById('admin-graph-from');
      var toEl = document.getElementById('admin-graph-to');
      if (fromEl) fromEl.value = from.toISOString().slice(0, 10);
      if (toEl) toEl.value = to.toISOString().slice(0, 10);
    }
    function renderAdminGraph() {
      var txs = (typeof AgentData !== 'undefined' ? AgentData.getTransactions() : []);
      txs = txs.filter(function(t) { return t.type === 'purchase'; });
      var range = getAdminGraphRange();
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
      var graphEl = document.getElementById('admin-graph');
      var legendEl = document.getElementById('admin-graph-legend');
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
      graphEl.innerHTML = '<svg width="100%" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" class="overflow-visible"><defs><linearGradient id="admin-line-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(250,204,21)" stop-opacity="0.3"/><stop offset="100%" stop-color="rgb(250,204,21)" stop-opacity="0"/></linearGradient></defs>' + (fillPath ? '<path d="' + fillPath + '" fill="url(#admin-line-fill)"/>' : '') + (pathD ? '<path d="' + pathD + '" fill="none" stroke="rgb(250,204,21)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : '') + pts.map(function(p) { return '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="rgb(250,204,21)"/>'; }).join('') + '</svg>';
      if (legendEl) legendEl.innerHTML = 'Total: <span class="text-yellow-400 font-medium">$' + totalSpent.toFixed(2) + '</span>';
    }
    (function initAdminGraph() {
      var to = new Date();
      var from = new Date(to);
      from.setMonth(from.getMonth() - 12);
      setAdminGraphRange(from, to);
      var fromEl = document.getElementById('admin-graph-from');
      var toEl = document.getElementById('admin-graph-to');
      if (fromEl) fromEl.addEventListener('change', renderAdminGraph);
      if (toEl) toEl.addEventListener('change', renderAdminGraph);
      [7, 30, 90, 365].forEach(function(days) {
        var btn = document.getElementById('admin-graph-preset-' + days);
        if (btn) btn.addEventListener('click', function() {
          var to = new Date();
          var from = new Date(to);
          from.setDate(from.getDate() - days);
          setAdminGraphRange(from, to);
          renderAdminGraph();
        });
      });
      renderAdminGraph();
    })();

    // Sidebar toggle (mobile/tablet)
    var sidebar = document.getElementById('admin-sidebar');
    var sidebarBackdrop = document.getElementById('admin-sidebar-backdrop');
    var sidebarToggle = document.getElementById('admin-sidebar-toggle');
    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
    }
    function toggleSidebar() {
      if (sidebar) sidebar.classList.toggle('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('hidden', !sidebar || !sidebar.classList.contains('open'));
    }
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

    // Panel switching
    document.querySelectorAll('.sidebar-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var panel = this.getAttribute('data-panel');
        document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.panel').forEach(function(p) { p.classList.add('hidden'); });
        var target = document.getElementById('panel-' + panel);
        if (target) target.classList.remove('hidden');
        if (panel === 'platform-orders' && typeof renderPlatformOrdersList === 'function') renderPlatformOrdersList();
        closeSidebar();
      });
    });
    document.querySelector('.sidebar-link[data-panel="overview"]').classList.add('active');

    var pendingGameLogo = null;
    document.getElementById('game-logo-add').addEventListener('change', function() {
      var f = this.files && this.files[0];
      if (!f || !f.type.match(/^image\//)) { pendingGameLogo = null; document.getElementById('game-logo-add-preview').textContent = ''; return; }
      if (f.size > 500000) { document.getElementById('game-logo-add-preview').textContent = 'Use image under 500KB'; pendingGameLogo = null; return; }
      var r = new FileReader();
      r.onload = function() { pendingGameLogo = r.result; document.getElementById('game-logo-add-preview').textContent = 'Image ready'; };
      r.readAsDataURL(f);
    });

    document.getElementById('form-add-game').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('game-name').value.trim();
      var player = document.getElementById('game-player').value.trim();
      var admin = document.getElementById('game-admin').value.trim();
      var logoUrl = document.getElementById('game-logo-url-add').value.trim();
      if (!name || !player || !admin) return;
      var game = { name: name, playerUrl: player, adminUrl: admin };
      if (pendingGameLogo) { game.logo = pendingGameLogo; pendingGameLogo = null; }
      else if (logoUrl) game.logoUrl = logoUrl;
      gamesData.push(game);
      AdminData.saveGamesData(gamesData);
      siteData.gameNames = siteData.gameNames || [];
      if (siteData.gameNames.indexOf(name) === -1) siteData.gameNames.push(name);
      AdminData.saveSiteData(siteData);
      document.getElementById('form-add-game').reset();
      document.getElementById('game-logo-add').value = '';
      document.getElementById('game-logo-url-add').value = '';
      document.getElementById('game-logo-add-preview').textContent = '';
      renderGamesList();
      document.getElementById('stat-games').textContent = gamesData.length;
      showMsg('games-msg', 'Game added.', true);
    });

    function renderGamesList() {
      var tbody = document.getElementById('games-list');
      tbody.innerHTML = gamesData.map(function(g, i) {
        var logoHtml = (g.logo || g.logoUrl) ? '<img src="' + (g.logo || g.logoUrl) + '" alt="" class="w-10 h-10 rounded-full object-cover border border-white/10">' : '<span class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 text-xs">No</span>';
        return '<tr class="border-b border-white/5 hover:bg-white/[0.02] align-top"><td class="px-4 py-2"><div class="flex flex-col gap-1">' + logoHtml + '<label class="cursor-pointer"><input type="file" accept="image/*" data-gidx="' + i + '" class="game-logo-upload hidden">' + '<span class="text-[10px] text-yellow-400 hover:underline">Upload</span></label></div></td><td class="px-4 py-2"><input type="text" data-gidx="' + i + '" data-f="name" value="' + (g.name || '').replace(/"/g, '&quot;') + '" class="w-28 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-4 py-2"><input type="url" data-gidx="' + i + '" data-f="playerUrl" value="' + (g.playerUrl || '').replace(/"/g, '&quot;') + '" class="w-36 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs outline-none truncate"></td><td class="px-4 py-2"><input type="url" data-gidx="' + i + '" data-f="adminUrl" value="' + (g.adminUrl || '').replace(/"/g, '&quot;') + '" class="w-36 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs outline-none"></td><td class="px-4 py-2"><button type="button" data-index="' + i + '" class="remove-game text-red-400 hover:text-red-300 text-xs">Remove</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.game-logo-upload').forEach(function(input) {
        input.addEventListener('change', function() {
          var f = this.files && this.files[0];
          if (!f || !f.type.match(/^image\//)) return;
          if (f.size > 500000) { alert('Use image under 500KB'); return; }
          var idx = parseInt(this.getAttribute('data-gidx'), 10);
          var r = new FileReader();
          r.onload = function() { gamesData[idx].logo = r.result; delete gamesData[idx].logoUrl; AdminData.saveGamesData(gamesData); renderGamesList(); };
          r.readAsDataURL(f);
        });
      });
      tbody.querySelectorAll('.remove-game').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          gamesData.splice(idx, 1);
          AdminData.saveGamesData(gamesData);
          siteData.gameNames = gamesData.map(function(g) { return g.name; });
          AdminData.saveSiteData(siteData);
          renderGamesList();
          document.getElementById('stat-games').textContent = gamesData.length;
        });
      });
    }

    document.getElementById('save-games').addEventListener('click', function() {
      gamesData.forEach(function(g, i) {
        var nameEl = document.querySelector('[data-gidx="' + i + '"][data-f="name"]');
        var playerEl = document.querySelector('[data-gidx="' + i + '"][data-f="playerUrl"]');
        var adminEl = document.querySelector('[data-gidx="' + i + '"][data-f="adminUrl"]');
        if (nameEl) g.name = nameEl.value.trim();
        if (playerEl) g.playerUrl = playerEl.value.trim();
        if (adminEl) g.adminUrl = adminEl.value.trim();
      });
      siteData.gameNames = gamesData.map(function(g) { return g.name; });
      AdminData.saveGamesData(gamesData);
      AdminData.saveSiteData(siteData);
      showMsg('games-save-msg', 'Games saved.', true);
    });
    renderGamesList();

    // Game Rates
    var rates = siteData.gameRates || [];
    function renderGameRates() {
      var tbody = document.getElementById('game-rates-list');
      tbody.innerHTML = rates.map(function(r, i) {
        var d = r.distributor || {}, s = r.subdistributor || {}, st = r.store || {};
        return '<tr class="border-b border-white/5" data-i="' + i + '"><td class="px-4 py-2"><input type="text" value="' + (r.name || '') + '" class="rate-name w-32 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (d.coin || 0) + '" class="rate-dc w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (d.rate || 0) + '" class="rate-dr w-14 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (s.coin || 0) + '" class="rate-sc w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (s.rate || 0) + '" class="rate-sr w-14 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (st.coin || 0) + '" class="rate-tc w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td><td class="px-2 py-1"><input type="number" value="' + (st.rate || 0) + '" class="rate-tr w-14 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none"></td></tr>';
      }).join('');
    }
    renderGameRates();

    document.getElementById('save-game-rates').addEventListener('click', function() {
      var rows = document.querySelectorAll('#game-rates-list tr');
      rates = [];
      rows.forEach(function(row) {
        var nameEl = row.querySelector('.rate-name');
        var dc = row.querySelector('.rate-dc'), dr = row.querySelector('.rate-dr');
        var sc = row.querySelector('.rate-sc'), sr = row.querySelector('.rate-sr');
        var tc = row.querySelector('.rate-tc'), tr = row.querySelector('.rate-tr');
        rates.push({
          name: nameEl ? nameEl.value.trim() : '',
          distributor: { coin: parseInt(dc ? dc.value : 0, 10) || 0, rate: parseInt(dr ? dr.value : 0, 10) || 0 },
          subdistributor: { coin: parseInt(sc ? sc.value : 0, 10) || 0, rate: parseInt(sr ? sr.value : 0, 10) || 0 },
          store: { coin: parseInt(tc ? tc.value : 0, 10) || 0, rate: parseInt(tr ? tr.value : 0, 10) || 0 }
        });
      });
      siteData.gameRates = rates;
      AdminData.saveSiteData(siteData);
      showMsg('game-rates-msg', 'Saved.', true);
    });

    // Agents & Rates
    var agents = AdminData.loadAgents();
    var agentRates = AdminData.loadAgentRates();
    var editingAgentId = null;

    document.getElementById('form-add-agent').addEventListener('submit', function(e) {
      e.preventDefault();
      var id = document.getElementById('agent-id').value.trim();
      var pw = document.getElementById('agent-password').value;
      var name = document.getElementById('agent-name').value.trim();
      if (!id) return;
      if (agents.some(function(a) { return (a.id || '').toLowerCase() === id.toLowerCase(); })) {
        showMsg('agents-msg', 'Agent ID already exists.', false);
        return;
      }
      agents.push({ id: id, password: pw, name: name || id });
      AdminData.saveAgents(agents);
      document.getElementById('form-add-agent').reset();
      renderAgentsList();
      showMsg('agents-msg', 'Agent added.', true);
    });

    function renderAgentsList() {
      agents = AdminData.loadAgents();
      var tbody = document.getElementById('agents-list');
      if (agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">No agents yet. Add one above. Until then, agent/Agent123 works as default.</td></tr>';
        return;
      }
      tbody.innerHTML = agents.map(function(a, i) {
        var hasCustom = !!(agentRates[a.id] && agentRates[a.id].length > 0);
        var bal = typeof AgentData !== 'undefined' && AgentData.getAgentBalances ? AgentData.getAgentBalances(a.id) : { chime: 0, crypto: 0 };
        var balStr = '$' + bal.chime.toFixed(2) + ' / $' + bal.crypto.toFixed(2);
        return '<tr class="border-b border-white/5 hover:bg-white/[0.02]"><td class="px-4 py-3 text-white font-medium">' + (a.id || '').replace(/</g, '&lt;') + '</td><td class="px-4 py-3 text-slate-400">' + (a.name || '—').replace(/</g, '&lt;') + '</td><td class="px-4 py-3 text-slate-400 text-xs">Chime: $' + bal.chime.toFixed(2) + '<br>Crypto: $' + bal.crypto.toFixed(2) + '</td><td class="px-4 py-3"><span class="text-xs ' + (hasCustom ? 'text-yellow-400' : 'text-slate-500') + '">' + (hasCustom ? 'Custom' : 'Default') + '</span></td><td class="px-4 py-3"><button type="button" data-agent-id="' + (a.id || '').replace(/"/g, '&quot;') + '" class="add-agent-balance text-green-400 hover:text-green-300 text-sm">Add Balance</button> <button type="button" data-agent-id="' + (a.id || '').replace(/"/g, '&quot;') + '" class="edit-agent-rates text-yellow-400 hover:text-yellow-300 text-sm">Edit Rates</button> <button type="button" data-index="' + i + '" class="remove-agent text-red-400 hover:text-red-300 text-sm">Remove</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.add-agent-balance').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var aid = btn.getAttribute('data-agent-id');
          var a = agents.find(function(x) { return x.id === aid; });
          document.getElementById('agent-balance-name').textContent = (a ? (a.name || a.id) : aid);
          document.getElementById('agent-add-balance').classList.remove('hidden');
          document.getElementById('form-add-agent-balance').dataset.agentId = aid || '';
          document.getElementById('agent-balance-amount').value = '';
          document.getElementById('agent-balance-ref').value = '';
        });
      });
      tbody.querySelectorAll('.edit-agent-rates').forEach(function(btn) {
        btn.addEventListener('click', function() {
          editingAgentId = btn.getAttribute('data-agent-id');
          openAgentRatesEditor(editingAgentId);
        });
      });
      tbody.querySelectorAll('.remove-agent').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          if (!confirm('Remove agent "' + (agents[idx].name || agents[idx].id) + '"?')) return;
          var aid = agents[idx].id;
          agents.splice(idx, 1);
          delete agentRates[aid];
          AdminData.saveAgents(agents);
          AdminData.saveAgentRates(agentRates);
          renderAgentsList();
          if (editingAgentId === aid) { editingAgentId = null; document.getElementById('agent-rates-editor').classList.add('hidden'); }
        });
      });
    }

    function openAgentRatesEditor(aid) {
      editingAgentId = aid;
      var a = agents.find(function(x) { return x.id === aid; });
      document.getElementById('agent-rates-name').textContent = (a ? (a.name || a.id) : aid);
      document.getElementById('agent-rates-editor').classList.remove('hidden');
      var rates = agentRates[aid] ? JSON.parse(JSON.stringify(agentRates[aid])) : [];
      renderAgentRatesTable(rates);
    }

    function getGameNames() {
      var rates = siteData.gameRates || [];
      if (rates.length > 0) return rates.map(function(r) { return r.name || ''; }).filter(Boolean);
      return (siteData.gameNames || []).filter(Boolean);
    }

    function toSimpleRate(r) {
      if (r.rate !== undefined) return { name: r.name, rate: parseInt(r.rate, 10) || 0 };
      var d = r.distributor || r.subdistributor || r.store || {};
      return { name: r.name, rate: parseInt(d.rate, 10) || 0 };
    }

    function renderAgentRatesTable(rates) {
      var gameNames = getGameNames().slice();
      rates.forEach(function(r) { if (r.name && gameNames.indexOf(r.name) === -1) gameNames.push(r.name); });
      var tbody = document.getElementById('agent-rates-list');
      var emptyOpt = '<option value="">— Select game —</option>';
      tbody.innerHTML = rates.map(function(r, i) {
        var sr = toSimpleRate(r);
        var sel = emptyOpt + gameNames.map(function(n) { return '<option value="' + (n || '').replace(/"/g, '&quot;') + '"' + ((sr.name || '') === (n || '') ? ' selected' : '') + '>' + (n || '').replace(/</g, '&lt;') + '</option>'; }).join('');
        return '<tr class="border-b border-white/5" data-i="' + i + '"><td class="px-4 py-2"><select class="ar-name w-40 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none">' + sel + '</select></td><td class="px-2 py-1"><input type="number" value="' + sr.rate + '" class="ar-rate w-20 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm outline-none" min="0" placeholder="Rate %"></td><td class="px-2 py-1"><button type="button" class="ar-remove text-red-400 text-xs">×</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.ar-remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var row = btn.closest('tr');
          if (row) row.remove();
        });
      });
    }

    document.getElementById('agent-rates-copy-default').addEventListener('click', function() {
      var defaultRates = (siteData.gameRates || []).map(function(r) { return toSimpleRate(r); });
      renderAgentRatesTable(JSON.parse(JSON.stringify(defaultRates)));
    });

    document.getElementById('agent-rates-add-row').addEventListener('click', function() {
      var tbody = document.getElementById('agent-rates-list');
      var rows = tbody.querySelectorAll('tr');
      var rates = [];
      rows.forEach(function(row) {
        var nameEl = row.querySelector('.ar-name');
        var rateEl = row.querySelector('.ar-rate');
        rates.push({
          name: nameEl ? nameEl.value.trim() : '',
          rate: parseInt(rateEl ? rateEl.value : 0, 10) || 0
        });
      });
      rates.push({ name: '', rate: 0 });
      renderAgentRatesTable(rates);
    });

    document.getElementById('agent-rates-clear').addEventListener('click', function() {
      if (!confirm('Clear custom rates for this agent? They will use default rates.')) return;
      if (editingAgentId) delete agentRates[editingAgentId];
      AdminData.saveAgentRates(agentRates);
      renderAgentsList();
      document.getElementById('agent-rates-editor').classList.add('hidden');
      showMsg('agent-rates-msg', 'Using default rates.', true);
    });

    document.getElementById('agent-rates-save').addEventListener('click', function() {
      if (!editingAgentId) return;
      var rows = document.querySelectorAll('#agent-rates-list tr');
      var rates = [];
      rows.forEach(function(row) {
        var nameEl = row.querySelector('.ar-name');
        var rateEl = row.querySelector('.ar-rate');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) return;
        rates.push({
          name: name,
          rate: parseInt(rateEl ? rateEl.value : 0, 10) || 0
        });
      });
      agentRates[editingAgentId] = rates;
      AdminData.saveAgentRates(agentRates);
      renderAgentsList();
      showMsg('agent-rates-msg', 'Custom rates saved. Agent will see them on next dashboard load.', true);
    });

    document.getElementById('agent-add-balance-close').addEventListener('click', function() {
      document.getElementById('agent-add-balance').classList.add('hidden');
    });

    document.getElementById('form-add-agent-balance').addEventListener('submit', function(e) {
      e.preventDefault();
      var aid = this.dataset.agentId;
      var amt = parseFloat(document.getElementById('agent-balance-amount').value) || 0;
      var method = document.getElementById('agent-balance-method').value;
      var ref = document.getElementById('agent-balance-ref').value.trim() || 'Admin credit';
      if (!aid || amt <= 0) { showMsg('agent-balance-msg', 'Enter a valid amount.', false); return; }
      if (typeof AgentData === 'undefined' || !AgentData.creditAgentBalance) { showMsg('agent-balance-msg', 'AgentData not loaded.', false); return; }
      if (AgentData.creditAgentBalance(aid, method, amt, ref)) {
        showMsg('agent-balance-msg', 'Balance added. Agent will see it on refresh.', true);
        document.getElementById('form-add-agent-balance').reset();
        renderAgentsList();
      } else {
        showMsg('agent-balance-msg', 'Failed to add balance.', false);
      }
    });

    renderAgentsList();

    // Agent Notices
    function renderNoticesList() {
      var notices = AdminData.loadAgentNotices();
      var listEl = document.getElementById('notices-list');
      if (!listEl) return;
      if (notices.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No notices yet. Send one above.</div>';
        return;
      }
      var typeClass = { info: 'border-l-blue-500/60 bg-blue-500/5', warning: 'border-l-amber-500/60 bg-amber-500/5', urgent: 'border-l-red-500/60 bg-red-500/5' };
      listEl.innerHTML = notices.map(function(n) {
        var cls = typeClass[n.type] || typeClass.info;
        var time = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
        return '<div class="p-4 flex items-start justify-between gap-4 border-l-4 ' + cls + '" data-id="' + (n.id || '').replace(/"/g, '&quot;') + '"><div class="flex-1 min-w-0"><p class="text-slate-300 text-sm">' + (n.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p><p class="text-slate-500 text-xs mt-1">' + time + ' · ' + (n.type || 'info') + '</p></div><button type="button" class="remove-notice shrink-0 text-slate-500 hover:text-red-400 text-sm" data-id="' + (n.id || '').replace(/"/g, '&quot;') + '">Remove</button></div>';
      }).join('');
      listEl.querySelectorAll('.remove-notice').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.getAttribute('data-id');
          AdminData.removeAgentNotice(id);
          renderNoticesList();
        });
      });
    }
    document.getElementById('form-add-notice').addEventListener('submit', function(e) {
      e.preventDefault();
      var msg = document.getElementById('notice-message').value.trim();
      var type = document.getElementById('notice-type').value || 'info';
      if (!msg) return;
      AdminData.addAgentNotice(msg, type);
      document.getElementById('notice-message').value = '';
      renderNoticesList();
      showMsg('notices-msg', 'Notice sent. Agents will see it on their dashboard.', true);
    });
    renderNoticesList();

    // API Documentation
    var pendingApiDocFile = null;
    document.getElementById('api-doc-file').addEventListener('change', function() {
      var f = this.files && this.files[0];
      pendingApiDocFile = null;
      if (!f) return;
      if (f.type !== 'application/pdf') { alert('Please upload a PDF file.'); return; }
      if (f.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); return; }
      var r = new FileReader();
      r.onload = function() {
        pendingApiDocFile = { data: r.result, fileName: f.name };
      };
      r.readAsDataURL(f);
    });
    var formApiDoc = document.getElementById('form-add-api-doc');
    if (formApiDoc) {
      formApiDoc.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('api-doc-name').value.trim();
        var category = (document.getElementById('api-doc-category').value || '').trim();
        if (!category) { showMsg('api-docs-msg', 'Enter a category name.', false); return; }
        var desc = document.getElementById('api-doc-desc').value.trim();
        var url = document.getElementById('api-doc-url').value.trim();
        if (!name) { showMsg('api-docs-msg', 'Enter a name.', false); return; }
        var doc = { name: name, description: desc, category: category };
        if (pendingApiDocFile) {
          doc.fileData = pendingApiDocFile.data;
          doc.fileName = pendingApiDocFile.fileName || 'document.pdf';
          pendingApiDocFile = null;
        } else if (url) {
          doc.fileUrl = url;
          doc.fileName = url.split('/').pop() || 'document.pdf';
        } else {
          showMsg('api-docs-msg', 'Upload a PDF file or enter a PDF URL.', false);
          return;
        }
        AdminData.addApiDoc(doc);
        formApiDoc.reset();
        document.getElementById('api-doc-file').value = '';
        renderApiDocsList();
        showMsg('api-docs-msg', 'API doc added. Users can download after login.', true);
      });
    }
    function renderApiDocsList() {
      var docs = AdminData.loadApiDocs();
      var listEl = document.getElementById('api-docs-list');
      if (!listEl) return;
      if (docs.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No API docs yet. Add one above.</div>';
        return;
      }
      listEl.innerHTML = docs.map(function(d) {
        var src = d.fileUrl ? 'URL' : 'PDF';
        return '<div class="p-4 flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><p class="text-white font-medium">' + (d.name || '').replace(/</g, '&lt;') + '</p><p class="text-slate-500 text-xs mt-1">' + (d.category || '') + ' · ' + src + '</p><p class="text-slate-400 text-sm mt-1">' + (d.description || '').replace(/</g, '&lt;') + '</p></div><button type="button" class="remove-api-doc shrink-0 text-slate-500 hover:text-red-400 text-sm" data-id="' + (d.id || '').replace(/"/g, '&quot;') + '">Remove</button></div>';
      }).join('');
      listEl.querySelectorAll('.remove-api-doc').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.getAttribute('data-id');
          AdminData.removeApiDoc(id);
          renderApiDocsList();
        });
      });
    }
    renderApiDocsList();

    // Demo UIs
    var editingDemoUiId = null;
    var pendingDemoUiImages = [];
    var fileInputDemoUi = document.getElementById('demo-ui-image-file');
    var previewEl = document.getElementById('demo-ui-image-preview');
    if (fileInputDemoUi) {
      fileInputDemoUi.addEventListener('change', function() {
        var files = Array.prototype.slice.call(this.files || []);
        pendingDemoUiImages = [];
        if (previewEl) { previewEl.classList.add('hidden'); previewEl.innerHTML = ''; }
        files = files.filter(function(f) { return f.type.match(/^image\/png/); }).slice(0, 3);
        if (files.length === 0) return;
        var results = new Array(files.length);
        var done = 0;
        files.forEach(function(f, idx) {
          if (f.size > 800000) { showMsg('demo-uis-msg', 'Each PNG must be under 800KB.', false); return; }
          var r = new FileReader();
          r.onload = (function(i) { return function() {
            results[i] = r.result;
            done++;
            if (done === files.length) {
              pendingDemoUiImages = results.filter(Boolean);
              if (previewEl) {
                pendingDemoUiImages.forEach(function(src) {
                  var img = document.createElement('img');
                  img.src = src;
                  img.alt = 'Preview';
                  img.className = 'max-h-24 rounded border border-white/10 object-cover';
                  previewEl.appendChild(img);
                });
                previewEl.classList.remove('hidden');
              }
              document.getElementById('demo-ui-image').value = '';
            }
          }; })(idx);
          r.readAsDataURL(f);
        });
      });
    }
    function resetDemoUiForm() {
      editingDemoUiId = null;
      formDemoUi.reset();
      document.getElementById('demo-ui-package').value = '';
      pendingDemoUiImages = [];
      if (fileInputDemoUi) fileInputDemoUi.value = '';
      if (previewEl) { previewEl.classList.add('hidden'); previewEl.innerHTML = ''; }
      document.getElementById('demo-ui-form-title').textContent = 'Add Demo UI';
      document.getElementById('demo-ui-submit-btn').textContent = 'Add Demo UI';
      document.getElementById('demo-ui-cancel-btn').classList.add('hidden');
    }
    var formDemoUi = document.getElementById('form-add-demo-ui');
    if (formDemoUi) {
      formDemoUi.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('demo-ui-name').value.trim();
        var packageId = (document.getElementById('demo-ui-package').value || '').trim();
        var imageUrl = document.getElementById('demo-ui-image').value.trim();
        var url = document.getElementById('demo-ui-url').value.trim();
        var desc = document.getElementById('demo-ui-desc').value.trim();
        if (!name) { showMsg('demo-uis-msg', 'Name is required.', false); return; }
        var images = pendingDemoUiImages.slice(0, 3);
        if (imageUrl && images.length < 3) images.push(imageUrl);
        images = images.slice(0, 3);
        siteData.demoUis = siteData.demoUis || [];
        if (editingDemoUiId) {
          var idx = siteData.demoUis.findIndex(function(d) { return d.id === editingDemoUiId; });
          if (idx >= 0) {
            siteData.demoUis[idx] = { id: editingDemoUiId, name: name, packageId: packageId || null, images: images.length ? images : (siteData.demoUis[idx].images || []), demoUrl: url || null, description: desc || null };
          }
          showMsg('demo-uis-msg', 'Demo UI updated.', true);
        } else {
          siteData.demoUis.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 9), name: name, packageId: packageId || null, images: images, demoUrl: url || null, description: desc || null });
          showMsg('demo-uis-msg', 'Demo UI added.', true);
        }
        AdminData.saveSiteData(siteData);
        resetDemoUiForm();
        renderDemoUisList();
      });
    }
    document.getElementById('demo-ui-cancel-btn').addEventListener('click', function() { resetDemoUiForm(); });
    function renderDemoUisList() {
      var list = (siteData.demoUis || []);
      var listEl = document.getElementById('demo-uis-list');
      if (!listEl) return;
      if (list.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No demo UIs yet. Add one above.</div>';
        return;
      }
      var pkgLabel = function(id) { return id ? (id.charAt(0).toUpperCase() + id.slice(1)) : '—'; };
      var getImages = function(d) {
        if (d.images && d.images.length) return d.images;
        var s = d.imageData || d.imageUrl || '';
        return s ? [s] : [];
      };
      var imgSafe = function(s) { return (s || '').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
      listEl.innerHTML = list.map(function(d) {
        var imgs = getImages(d);
        var thumbHtml = imgs.length ? '<div class="flex gap-1 w-20 h-10">' + imgs.slice(0, 3).map(function(src) { return '<div class="flex-1 min-w-0 rounded bg-white/5 overflow-hidden"><img src="' + imgSafe(src) + '" alt="" class="w-full h-full object-cover"></div>'; }).join('') + '</div>' : '<div class="w-16 h-10 rounded bg-white/5 flex items-center justify-center"><span class="text-slate-600 text-xs">No img</span></div>';
        return '<div class="p-4 flex items-start justify-between gap-4" data-id="' + (d.id || '').replace(/"/g, '&quot;') + '"><div class="flex gap-4 flex-1 min-w-0"><div class="shrink-0">' + thumbHtml + '</div><div class="min-w-0"><p class="text-white font-medium">' + (d.name || '').replace(/</g, '&lt;') + '</p><p class="text-slate-500 text-xs">' + pkgLabel(d.packageId) + (d.demoUrl ? ' · <a href="' + d.demoUrl.replace(/</g, '&lt;') + '" target="_blank" rel="noopener" class="text-yellow-400 hover:underline">View demo</a>' : '') + '</p><p class="text-slate-400 text-xs mt-1 truncate">' + (d.description || '').replace(/</g, '&lt;') + '</p></div></div><div class="shrink-0 flex items-center gap-2"><button type="button" class="edit-demo-ui text-slate-500 hover:text-yellow-400 text-sm" data-id="' + (d.id || '').replace(/"/g, '&quot;') + '">Edit</button><button type="button" class="remove-demo-ui text-slate-500 hover:text-red-400 text-sm" data-id="' + (d.id || '').replace(/"/g, '&quot;') + '">Remove</button></div></div>';
      }).join('');
      listEl.querySelectorAll('.remove-demo-ui').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.getAttribute('data-id');
          siteData.demoUis = (siteData.demoUis || []).filter(function(d) { return d.id !== id; });
          AdminData.saveSiteData(siteData);
          if (editingDemoUiId === id) resetDemoUiForm();
          renderDemoUisList();
        });
      });
      listEl.querySelectorAll('.edit-demo-ui').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = btn.getAttribute('data-id');
          var d = (siteData.demoUis || []).find(function(x) { return x.id === id; });
          if (!d) return;
          editingDemoUiId = id;
          document.getElementById('demo-ui-name').value = d.name || '';
          document.getElementById('demo-ui-package').value = d.packageId || '';
          document.getElementById('demo-ui-image').value = '';
          document.getElementById('demo-ui-url').value = d.demoUrl || '';
          document.getElementById('demo-ui-desc').value = d.description || '';
          pendingDemoUiImages = [];
          var imgs = (d.images && d.images.length) ? d.images : ((d.imageData || d.imageUrl) ? [d.imageData || d.imageUrl] : []);
          if (previewEl) {
            previewEl.innerHTML = '';
            imgs.forEach(function(src) {
              var img = document.createElement('img');
              img.src = src;
              img.alt = 'Preview';
              img.className = 'max-h-24 rounded border border-white/10 object-cover';
              previewEl.appendChild(img);
            });
            previewEl.classList.toggle('hidden', imgs.length === 0);
          }
          pendingDemoUiImages = imgs.slice();
          document.getElementById('demo-ui-form-title').textContent = 'Edit Demo UI';
          document.getElementById('demo-ui-submit-btn').textContent = 'Update Demo UI';
          document.getElementById('demo-ui-cancel-btn').classList.remove('hidden');
          document.getElementById('demo-ui-name').focus();
        });
      });
    }
    renderDemoUisList();

    // Platform Orders
    function loadPlatformOrders() {
      try { return JSON.parse(localStorage.getItem('gch_platform_orders') || '[]'); } catch (err) { return []; }
    }
    function renderPlatformOrdersList() {
      var orders = loadPlatformOrders();
      var listEl = document.getElementById('platform-orders-list');
      if (!listEl) return;
      if (orders.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No platform package orders yet.</div>';
        return;
      }
      listEl.innerHTML = orders.map(function(o) {
        var dt = o.time ? new Date(o.time).toLocaleString() : '—';
        return '<div class="p-4 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors"><div class="flex-1 min-w-0"><p class="text-white font-medium">' + (o.packageName || o.packageId || 'Package').replace(/</g, '&lt;') + '</p><p class="text-slate-500 text-xs mt-0.5">Agent: ' + (o.agentId || '—').replace(/</g, '&lt;') + '</p><p class="text-slate-400 text-sm mt-1">' + (o.notes || '—').replace(/</g, '&lt;') + '</p><p class="text-slate-600 text-xs mt-1">' + dt + '</p></div></div>';
      }).join('');
    }
    renderPlatformOrdersList();

    // Navigation
    document.getElementById('edit-nav').value = (siteData.nav || []).map(function(n) { return (n.label || '') + '|' + (n.href || ''); }).join('\n');
    document.getElementById('edit-footer').value = (siteData.footerLinks || []).map(function(n) { return (n.label || '') + '|' + (n.href || ''); }).join('\n');

    document.getElementById('save-nav').addEventListener('click', function() {
      function parseLinks(text) {
        return text.split('\n').map(function(line) {
          var parts = line.trim().split('|');
          return { label: (parts[0] || '').trim(), href: (parts[1] || '').trim() };
        }).filter(function(l) { return l.label; });
      }
      siteData.nav = parseLinks(document.getElementById('edit-nav').value);
      siteData.footerLinks = parseLinks(document.getElementById('edit-footer').value);
      AdminData.saveSiteData(siteData);
      document.getElementById('stat-nav').textContent = siteData.nav.length;
      showMsg('nav-msg', 'Navigation saved.', true);
    });

    // Services
    var services = siteData.services || [];
    function renderServices() {
      var cont = document.getElementById('services-editor');
      cont.innerHTML = services.map(function(s, i) {
        return '<div class="glass-panel rounded-lg p-4"><div class="grid gap-3 md:grid-cols-2"><input type="text" data-i="' + i + '" data-f="title" value="' + (s.title || '') + '" placeholder="Title" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-i="' + i + '" data-f="icon" value="' + (s.icon || '') + '" placeholder="Icon" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-i="' + i + '" data-f="href" value="' + (s.href || '') + '" placeholder="Link" class="md:col-span-2 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><textarea data-i="' + i + '" data-f="desc" rows="2" placeholder="Description" class="md:col-span-2 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm">' + (s.desc || '') + '</textarea><label class="flex items-center gap-2 text-sm"><input type="checkbox" data-i="' + i + '" data-f="popular" ' + (s.popular ? 'checked' : '') + ' class="rounded"> Popular</label></div></div>';
      }).join('');
    }
    renderServices();

    document.getElementById('save-services').addEventListener('click', function() {
      services.forEach(function(s, i) {
        var titleEl = document.querySelector('[data-i="' + i + '"][data-f="title"]');
        var iconEl = document.querySelector('[data-i="' + i + '"][data-f="icon"]');
        var hrefEl = document.querySelector('[data-i="' + i + '"][data-f="href"]');
        var descEl = document.querySelector('[data-i="' + i + '"][data-f="desc"]');
        var popEl = document.querySelector('[data-i="' + i + '"][data-f="popular"]');
        if (titleEl) s.title = titleEl.value.trim();
        if (iconEl) s.icon = iconEl.value.trim();
        if (hrefEl) s.href = hrefEl.value.trim();
        if (descEl) s.desc = descEl.value.trim();
        s.popular = popEl ? popEl.checked : false;
      });
      siteData.services = services;
      AdminData.saveSiteData(siteData);
      showMsg('services-msg', 'Services saved.', true);
    });

    // Packages
    var packages = siteData.packages || [];
    function renderPackages() {
      var cont = document.getElementById('packages-editor');
      cont.innerHTML = packages.map(function(p, i) {
        var features = (p.features || []).join('\n');
        return '<div class="glass-panel rounded-lg p-4"><div class="grid gap-3 md:grid-cols-2"><input type="text" data-p="' + i + '" data-f="name" value="' + (p.name || '') + '" placeholder="Name" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-p="' + i + '" data-f="subtitle" value="' + (p.subtitle || '') + '" placeholder="Subtitle" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-p="' + i + '" data-f="badge" value="' + (p.badge || '') + '" placeholder="Badge (e.g. Most Popular)" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-p="' + i + '" data-f="icon" value="' + (p.icon || '') + '" placeholder="Icon" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><select data-p="' + i + '" data-f="iconType" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><option value="letter"' + (p.iconType === 'letter' ? ' selected' : '') + '>Letter</option><option value="icon"' + (p.iconType === 'icon' ? ' selected' : '') + '>Icon</option></select><textarea data-p="' + i + '" data-f="features" rows="4" placeholder="Features (one per line)" class="md:col-span-2 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm">' + features + '</textarea><label class="flex items-center gap-2 text-sm"><input type="checkbox" data-p="' + i + '" data-f="popular" ' + (p.popular ? 'checked' : '') + ' class="rounded"> Popular</label></div></div>';
      }).join('');
    }
    renderPackages();

    document.getElementById('save-packages').addEventListener('click', function() {
      packages.forEach(function(p, i) {
        var nameEl = document.querySelector('[data-p="' + i + '"][data-f="name"]');
        var subEl = document.querySelector('[data-p="' + i + '"][data-f="subtitle"]');
        var badgeEl = document.querySelector('[data-p="' + i + '"][data-f="badge"]');
        var iconEl = document.querySelector('[data-p="' + i + '"][data-f="icon"]');
        var typeEl = document.querySelector('[data-p="' + i + '"][data-f="iconType"]');
        var featEl = document.querySelector('[data-p="' + i + '"][data-f="features"]');
        var popEl = document.querySelector('[data-p="' + i + '"][data-f="popular"]');
        if (nameEl) p.name = nameEl.value.trim();
        if (subEl) p.subtitle = subEl.value.trim();
        if (badgeEl) p.badge = badgeEl.value.trim() || null;
        if (iconEl) p.icon = iconEl.value.trim();
        if (typeEl) p.iconType = typeEl.value || 'letter';
        if (featEl) p.features = featEl.value.split('\n').map(function(f) { return f.trim(); }).filter(Boolean);
        p.popular = popEl ? popEl.checked : false;
      });
      siteData.packages = packages;
      AdminData.saveSiteData(siteData);
      showMsg('packages-msg', 'Packages saved.', true);
    });

    // Marketplace
    var marketplace = siteData.marketplace || [];
    function renderMarketplace() {
      var cont = document.getElementById('marketplace-editor');
      cont.innerHTML = marketplace.map(function(m, i) {
        return '<div class="glass-panel rounded-lg p-4"><div class="grid gap-3 md:grid-cols-2"><input type="text" data-m="' + i + '" data-f="title" value="' + (m.title || '') + '" placeholder="Title" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-m="' + i + '" data-f="icon" value="' + (m.icon || '') + '" placeholder="Icon" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-m="' + i + '" data-f="color" value="' + (m.color || '') + '" placeholder="Color (blue,purple,green,pink,yellow)" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-m="' + i + '" data-f="desc" value="' + (m.desc || '') + '" placeholder="Description" class="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"></div></div>';
      }).join('');
    }
    renderMarketplace();
    document.getElementById('save-marketplace').addEventListener('click', function() {
      marketplace.forEach(function(m, i) {
        var titleEl = document.querySelector('[data-m="' + i + '"][data-f="title"]');
        var iconEl = document.querySelector('[data-m="' + i + '"][data-f="icon"]');
        var colorEl = document.querySelector('[data-m="' + i + '"][data-f="color"]');
        var descEl = document.querySelector('[data-m="' + i + '"][data-f="desc"]');
        if (titleEl) m.title = titleEl.value.trim();
        if (iconEl) m.icon = iconEl.value.trim();
        if (colorEl) m.color = colorEl.value.trim();
        if (descEl) m.desc = descEl.value.trim();
      });
      siteData.marketplace = marketplace;
      AdminData.saveSiteData(siteData);
      showMsg('marketplace-msg', 'Marketplace saved.', true);
    });

    // Features
    var features = siteData.features || [];
    function renderFeatures() {
      var cont = document.getElementById('features-editor');
      cont.innerHTML = features.map(function(f, i) {
        return '<div class="flex gap-3 items-center"><input type="text" data-f="' + i + '" data-field="title" value="' + (f.title || '') + '" placeholder="Title" class="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"><input type="text" data-f="' + i + '" data-field="icon" value="' + (f.icon || '') + '" placeholder="Icon (e.g. solar:bolt-linear)" class="w-48 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm"></div>';
      }).join('');
    }
    renderFeatures();

    document.getElementById('save-features').addEventListener('click', function() {
      features.forEach(function(f, i) {
        var titleEl = document.querySelector('[data-f="' + i + '"][data-field="title"]');
        var iconEl = document.querySelector('[data-f="' + i + '"][data-field="icon"]');
        if (titleEl) f.title = titleEl.value.trim();
        if (iconEl) f.icon = iconEl.value.trim();
      });
      siteData.features = features;
      AdminData.saveSiteData(siteData);
      showMsg('features-msg', 'Features saved.', true);
    });

    // Blogs
    var blogs = siteData.blogs || [];
    function renderBlogsList() {
      var tbody = document.getElementById('blogs-list');
      tbody.innerHTML = blogs.map(function(b, i) {
        var hasPdf = !!(b.pdfUrl || b.pdfData);
        return '<tr class="border-b border-white/5 hover:bg-white/[0.02]"><td class="px-4 py-2 text-white">' + (b.title || 'Untitled') + '</td><td class="px-4 py-2 text-xs">' + (hasPdf ? 'PDF attached' : 'No PDF') + '</td><td class="px-4 py-2"><button type="button" data-bidx="' + i + '" class="remove-blog text-red-400 hover:text-red-300 text-xs">Remove</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.remove-blog').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.getAttribute('data-bidx'), 10);
          blogs.splice(idx, 1);
          siteData.blogs = blogs;
          AdminData.saveSiteData(siteData);
          renderBlogsList();
        });
      });
    }
    renderBlogsList();

    document.getElementById('form-add-blog').addEventListener('submit', function(e) {
      e.preventDefault();
      var title = document.getElementById('blog-title').value.trim();
      var desc = document.getElementById('blog-desc').value.trim();
      var pdfUrl = document.getElementById('blog-pdf-url').value.trim();
      var pdfFile = document.getElementById('blog-pdf-file').files && document.getElementById('blog-pdf-file').files[0];
      if (!title) return;
      var blog = { title: title, desc: desc || '' };
      if (pdfUrl) blog.pdfUrl = pdfUrl;
      else if (pdfFile && pdfFile.type === 'application/pdf') {
        if (pdfFile.size > 2000000) { showMsg('blogs-msg', 'PDF must be under 2MB.', false); return; }
        var reader = new FileReader();
        reader.onload = function() {
          blog.pdfData = reader.result;
          blogs.push(blog);
          siteData.blogs = blogs;
          AdminData.saveSiteData(siteData);
          document.getElementById('form-add-blog').reset();
          document.getElementById('blog-pdf-file').value = '';
          renderBlogsList();
          showMsg('blogs-msg', 'Blog added.', true);
        };
        reader.readAsDataURL(pdfFile);
        return;
      }
      blogs.push(blog);
      siteData.blogs = blogs;
      AdminData.saveSiteData(siteData);
      document.getElementById('form-add-blog').reset();
      renderBlogsList();
      showMsg('blogs-msg', 'Blog added.', true);
    });

    // Contact
    var contact = siteData.contact || {};
    document.getElementById('contact-email').value = contact.email || '';
    document.getElementById('contact-phone').value = contact.phone || '';
    document.getElementById('contact-whatsapp').value = contact.whatsapp || '';
    document.getElementById('contact-telegram').value = contact.telegram || '';
    document.getElementById('contact-address').value = contact.address || '';
    document.getElementById('save-contact').addEventListener('click', function() {
      siteData.contact = {
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
        whatsapp: document.getElementById('contact-whatsapp').value.trim(),
        telegram: document.getElementById('contact-telegram').value.trim(),
        address: document.getElementById('contact-address').value.trim()
      };
      AdminData.saveSiteData(siteData);
      showMsg('contact-msg', 'Contact info saved.', true);
    });

    // Marquee
    document.getElementById('edit-marquee').value = Array.isArray(siteData.marqueeGames) ? siteData.marqueeGames.join(', ') : '';
    document.getElementById('save-marquee').addEventListener('click', function() {
      var text = document.getElementById('edit-marquee').value;
      siteData.marqueeGames = text.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      AdminData.saveSiteData(siteData);
      showMsg('marquee-msg', 'Marquee saved.', true);
    });

    // Export
    document.getElementById('export-btn').addEventListener('click', function() {
      var sd = AdminData.loadSiteData();
      var gd = AdminData.loadGamesData();
      var siteJs = 'const SITE_DATA = ' + JSON.stringify(sd, null, 2) + ';\n';
      var gamesJs = 'const GAMES_DATA = ' + JSON.stringify(gd, null, 2) + ';\n';
      function download(content, filename) {
        var a = document.createElement('a');
        a.href = 'data:application/javascript;charset=utf-8,' + encodeURIComponent(content);
        a.download = filename;
        a.click();
      }
      download(siteJs, 'site-data.js');
      download(gamesJs, 'games-data.js');
      var toast = document.getElementById('toast');
      if (toast) { toast.textContent = 'Config downloaded. Replace js/site-data.js and js/games-data.js.'; toast.className = 'fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/30'; toast.classList.remove('hidden'); setTimeout(function() { toast.classList.add('hidden'); }, 4000); }
    });

    // Reset
    document.getElementById('reset-btn').addEventListener('click', function() {
      if (!confirm('Clear all custom data and revert to original site-data.js and games-data.js?')) return;
      AdminData.clearOverrides();
      location.reload();
    });
  }

  showUI();
})();
