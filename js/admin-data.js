// Admin data layer - loads from localStorage overrides or static SITE_DATA/GAMES_DATA
(function() {
  var STORAGE_KEY = 'gch_site_data';
  var GAMES_KEY = 'gch_games_data';
  var AGENTS_KEY = 'gch_agents';
  var AGENT_RATES_KEY = 'gch_agent_rates';
  var AGENT_NOTICES_KEY = 'gch_agent_notices';
  var API_DOCS_KEY = 'gch_api_docs';

  var DEFAULT_GAME_RATES = (typeof SITE_DATA !== 'undefined' && SITE_DATA.gameRates && SITE_DATA.gameRates.length) ? JSON.parse(JSON.stringify(SITE_DATA.gameRates)) : ((typeof window !== 'undefined' && window.__GCH_DEFAULT_GAME_RATES && window.__GCH_DEFAULT_GAME_RATES.length) ? window.__GCH_DEFAULT_GAME_RATES : []);

  function getDefaultGameRates() {
    return DEFAULT_GAME_RATES.length ? JSON.parse(JSON.stringify(DEFAULT_GAME_RATES)) : [];
  }

  function loadSiteData() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.gameRates || !parsed.gameRates.length) parsed.gameRates = DEFAULT_GAME_RATES;
          return parsed;
        }
      }
    } catch (e) {}
    var fallback = typeof SITE_DATA !== 'undefined' ? JSON.parse(JSON.stringify(SITE_DATA)) : {};
    if (!fallback.gameRates || !fallback.gameRates.length) fallback.gameRates = DEFAULT_GAME_RATES;
    return fallback;
  }

  function loadGamesData() {
    try {
      var stored = localStorage.getItem(GAMES_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return typeof GAMES_DATA !== 'undefined' ? JSON.parse(JSON.stringify(GAMES_DATA)) : [];
  }

  function saveSiteData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function saveGamesData(data) {
    localStorage.setItem(GAMES_KEY, JSON.stringify(data));
  }

  function loadAgents() {
    try {
      var stored = localStorage.getItem(AGENTS_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveAgents(agents) {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  }

  function loadAgentRates() {
    try {
      var stored = localStorage.getItem(AGENT_RATES_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  }

  function saveAgentRates(ratesByAgent) {
    localStorage.setItem(AGENT_RATES_KEY, JSON.stringify(ratesByAgent));
  }

  function clearOverrides() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GAMES_KEY);
    localStorage.removeItem(AGENTS_KEY);
    localStorage.removeItem(AGENT_RATES_KEY);
  }

  function hasOverrides() {
    return !!localStorage.getItem(STORAGE_KEY) || !!localStorage.getItem(GAMES_KEY) || !!localStorage.getItem(AGENTS_KEY) || !!localStorage.getItem(AGENT_RATES_KEY);
  }

  function loadAgentNotices() {
    try {
      var stored = localStorage.getItem(AGENT_NOTICES_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveAgentNotices(notices) {
    try {
      localStorage.setItem(AGENT_NOTICES_KEY, JSON.stringify(notices || []));
      return true;
    } catch (e) {}
    return false;
  }

  function addAgentNotice(message, type) {
    var notices = loadAgentNotices();
    notices.unshift({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      message: (message || '').trim(),
      type: type || 'info',
      createdAt: new Date().toISOString()
    });
    if (notices.length > 50) notices = notices.slice(0, 50);
    saveAgentNotices(notices);
    return notices[0];
  }

  function removeAgentNotice(id) {
    var notices = loadAgentNotices().filter(function(n) { return n.id !== id; });
    saveAgentNotices(notices);
  }

  function loadApiDocs() {
    try {
      var stored = localStorage.getItem(API_DOCS_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveApiDocs(docs) {
    try {
      localStorage.setItem(API_DOCS_KEY, JSON.stringify(docs || []));
      return true;
    } catch (e) {}
    return false;
  }

  function addApiDoc(doc) {
    var docs = loadApiDocs();
    var d = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      name: (doc.name || '').trim(),
      description: (doc.description || '').trim(),
      category: (doc.category || '').trim() || 'API',
      fileData: doc.fileData || null,
      fileUrl: doc.fileUrl || null,
      fileName: doc.fileName || 'document.pdf',
      createdAt: new Date().toISOString()
    };
    docs.unshift(d);
    if (docs.length > 50) docs = docs.slice(0, 50);
    saveApiDocs(docs);
    return d;
  }

  function removeApiDoc(id) {
    var docs = loadApiDocs().filter(function(d) { return d.id !== id; });
    saveApiDocs(docs);
  }

  window.AdminData = {
    loadSiteData: loadSiteData,
    getDefaultGameRates: getDefaultGameRates,
    loadGamesData: loadGamesData,
    saveSiteData: saveSiteData,
    saveGamesData: saveGamesData,
    loadAgents: loadAgents,
    saveAgents: saveAgents,
    loadAgentRates: loadAgentRates,
    saveAgentRates: saveAgentRates,
    clearOverrides: clearOverrides,
    hasOverrides: hasOverrides,
    loadAgentNotices: loadAgentNotices,
    saveAgentNotices: saveAgentNotices,
    addAgentNotice: addAgentNotice,
    removeAgentNotice: removeAgentNotice,
    loadApiDocs: loadApiDocs,
    saveApiDocs: saveApiDocs,
    addApiDoc: addApiDoc,
    removeApiDoc: removeApiDoc,
    STORAGE_KEY: STORAGE_KEY,
    GAMES_KEY: GAMES_KEY,
    AGENTS_KEY: AGENTS_KEY,
    AGENT_RATES_KEY: AGENT_RATES_KEY
  };
})();
