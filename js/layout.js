// Apply admin overrides from localStorage (if any), then render nav/footer
(function() {
  try {
    var stored = localStorage.getItem('gch_site_data');
    if (stored && typeof SITE_DATA !== 'undefined') {
      var parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        for (var k in parsed) if (parsed.hasOwnProperty(k)) {
          if (k === 'gameRates' && (!parsed[k] || !parsed[k].length)) continue;
          SITE_DATA[k] = parsed[k];
        }
      }
    }
  } catch (e) {}
  if (typeof SITE_DATA === 'undefined') return;
  var page = (window.CURRENT_PAGE || '').replace('.html', '');
  var navEl = document.getElementById('nav-links');
  var footerEl = document.getElementById('footer-links');
  if (navEl && SITE_DATA.nav) {
    navEl.innerHTML = SITE_DATA.nav.map(function(item) {
      var href = item.href || '#';
      var active = href.indexOf(page) !== -1 || (page === 'index' && href === 'index.html') ? ' text-yellow-400' : ' hover:text-white transition-colors';
      return '<a href="' + href + '" class="' + active + '">' + item.label + '</a>';
    }).join('');
  }
  if (footerEl && SITE_DATA.footerLinks) {
    footerEl.innerHTML = SITE_DATA.footerLinks.map(function(item) {
      return '<a href="' + (item.href || '#') + '" class="hover:text-white transition-colors">' + item.label + '</a>';
    }).join('');
  }
  var contact = SITE_DATA.contact || {};
  var contactEl = document.getElementById('footer-contact');
  if (contactEl && (contact.email || contact.phone || contact.whatsapp || contact.telegram)) {
    var parts = [];
    if (contact.email) parts.push('<a href="mailto:' + contact.email + '" class="hover:text-white transition-colors">' + contact.email + '</a>');
    if (contact.phone) parts.push('<a href="tel:' + contact.phone.replace(/\s/g, '') + '" class="hover:text-white transition-colors">' + contact.phone + '</a>');
    if (contact.whatsapp) parts.push('<a href="https://wa.me/' + contact.whatsapp.replace(/\D/g, '') + '" target="_blank" rel="noopener" class="hover:text-white transition-colors">WhatsApp</a>');
    if (contact.telegram) parts.push('<a href="https://t.me/' + contact.telegram.replace('@', '') + '" target="_blank" rel="noopener" class="hover:text-white transition-colors">Telegram</a>');
    contactEl.innerHTML = parts.join(' <span class="text-slate-600">|</span> ');
    contactEl.classList.remove('hidden');
  }

  // Mobile nav
  (function initMobileNav() {
    var navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    var nav = navLinks.closest('nav');
    if (!nav || document.getElementById('nav-mobile-btn')) return;
    var actionsDiv = navLinks.nextElementSibling;
    var rightGroup = navLinks.parentElement;
    var btn = document.createElement('button');
    btn.id = 'nav-mobile-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.className = 'md:hidden p-2 -mr-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors';
    btn.innerHTML = '<iconify-icon icon="solar:hamburger-menu-linear" width="24"></iconify-icon>';
    var panel = document.createElement('div');
    panel.id = 'nav-mobile';
    panel.className = 'hidden fixed top-16 left-0 right-0 bg-[#0E0E11] border-b border-white/10 z-40 py-4 px-6 max-h-[calc(100vh-4rem)] overflow-y-auto';
    var mobileLinksHtml = (navLinks.innerHTML || '').replace(/hover:text-white/g, 'block py-2 hover:text-white');
    var mobileActionsHtml = actionsDiv ? (actionsDiv.innerHTML || '').replace(/hidden\s+md:block|hidden\s+md:flex/g, 'block').replace(/flex\s+items-center\s+gap-4/g, 'flex flex-col gap-2') : '';
    panel.innerHTML = '<div class="flex flex-col gap-4"><div class="flex flex-col gap-2 text-sm">' + mobileLinksHtml + '</div>' + (mobileActionsHtml ? '<div class="flex flex-col gap-2 pt-4 border-t border-white/10">' + mobileActionsHtml + '</div>' : '') + '</div>';
    rightGroup.insertBefore(btn, navLinks);
    document.body.appendChild(panel);
    btn.addEventListener('click', function() {
      var isOpen = !panel.classList.contains('hidden');
      panel.classList.toggle('hidden', isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
    panel.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', function() { panel.classList.add('hidden'); document.body.style.overflow = ''; }); });
  })();
})();
