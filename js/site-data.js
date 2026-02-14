// Central site data - edit here to update content across the website
const SITE_DATA = {
  nav: [
    { label: "Services", href: "index.html#services" },
    { label: "API", href: "api.html" },
    { label: "Gaming Coins", href: "gaming-coins.html" },
    { label: "Links", href: "game-rates.html" },
    { label: "Sweepstake Sites", href: "sweepstake-websites.html" },
    { label: "Virtual Numbers", href: "virtual-numbers.html" },
    { label: "IP Proxies", href: "ip-proxies.html" },
    { label: "Blog", href: "blog.html" },
    { label: "Contact", href: "contact.html" }
  ],
  footerLinks: [
    { label: "API", href: "api.html" },
    { label: "Gaming Coins", href: "gaming-coins.html" },
    { label: "Links", href: "game-rates.html" },
    { label: "Sweepstake Sites", href: "sweepstake-websites.html" },
    { label: "Virtual Numbers", href: "virtual-numbers.html" },
    { label: "IP Proxies", href: "ip-proxies.html" },
    { label: "Blog", href: "blog.html" },
    { label: "Contact", href: "contact.html" }
  ],
  services: [
    { title: "Website Builder", icon: "solar:monitor-smartphone-linear", desc: "Deploy Bronze, Gold, or Diamond tier platforms instantly. Select UI themes, configure add-ons, and launch automatically.", href: "sweepstake-websites.html", popular: false },
    { title: "Instant Coin System", icon: "solar:card-transfer-linear", desc: "Automated wallet reloading for agents. Real-time transaction logs and instant delivery for 28+ games.", href: "gaming-coins.html", popular: true },
    { title: "Infrastructure Marketplace", icon: "solar:server-path-linear", desc: "Residential IPs, RDP access, Virtual Numbers with instant credential delivery.", href: "ip-proxies.html", popular: false }
  ],
  packages: [
    { id: "bronze", name: "Bronze", badge: null, subtitle: "Starter Kit", icon: "B", iconType: "letter", features: ["1 Default UI Theme", "Basic Admin Panel", "Manual Reload Only", "Subdomain Access", "1 Admin Account"], popular: false },
    { id: "gold", name: "Gold", badge: "Most Popular", subtitle: "Agency Standard", icon: "G", iconType: "letter", features: ["Multiple UI Themes", "Auto Payment Integration", "Custom Branding (Logo/Color)", "Up to 3 Admin Accounts", "Priority Support"], popular: true },
    { id: "diamond", name: "Diamond", badge: null, subtitle: "Enterprise Scale", icon: "solar:diamond-linear", iconType: "icon", features: ["All UI Themes Included", "Full Automation Engine", "Custom Domain & White-label", "Unlimited Admin Accounts", "VIP Support & Dedicated Hosting"], popular: false }
  ],
  marketplace: [
    { title: "Custom Domain", icon: "solar:globe-linear", desc: "Remove subdomain limits.", color: "blue" },
    { title: "Extra Payments", icon: "solar:card-recieved-linear", desc: "Add more gateways.", color: "purple" },
    { title: "Extra Admin", icon: "solar:user-plus-linear", desc: "Expand your team.", color: "green" },
    { title: "Brand Pack", icon: "solar:palette-linear", desc: "Full UI customization.", color: "pink" },
    { title: "Dedicated Host", icon: "solar:server-square-update-linear", desc: "Maximum performance.", color: "yellow" }
  ],
  features: [
    { title: "95% Automated", icon: "solar:settings-minimalistic-linear" },
    { title: "Instant Delivery", icon: "solar:bolt-linear" },
    { title: "Built for Agents", icon: "solar:users-group-two-rounded-linear" },
    { title: "Secure Infra", icon: "solar:shield-check-linear" },
    { title: "Scale Ready", icon: "solar:graph-up-linear" }
  ],
  marqueeGames: ["Firekirin", "Juwa", "VegasX", "Orion Star", "Panda Master", "Blue Dragon", "Cash Frenzy", "Game Room"],
  demoUis: [],
  blogs: [],
  contact: { email: "", phone: "", whatsapp: "", telegram: "", address: "" },
  gameNames: ["Blue Dragon", "Cash Frenzy", "Cash Machine", "Casino Ignite", "Egame", "Firekirin", "Game Room", "Game Vault", "Golden Dragon", "Joker", "Juwa", "Juwa 2.0", "King of Pop", "Mafia", "Mega Spin", "Milkyway", "Mr All in One", "Orion Star", "Panda Master", "RiverSweep", "Sirus", "UltraPanda", "VBlink", "Vegas Roll", "Vegas Sweeps", "VegasX", "Win Star", "Yolo"],
  gameRates: [
    { name: "Blue Dragon", distributor: { coin: 5000, rate: 16 }, subdistributor: { coin: 1000, rate: 17 }, store: { coin: 500, rate: 18 } },
    { name: "Cash Frenzy", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Cash Machine", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Casino Ignite", distributor: { coin: 5000, rate: 14 }, subdistributor: { coin: 1000, rate: 15 }, store: { coin: 500, rate: 16 } },
    { name: "Egame", distributor: { coin: 5000, rate: 13 }, subdistributor: { coin: 1000, rate: 14 }, store: { coin: 500, rate: 15 } },
    { name: "Firekirin", distributor: { coin: 5000, rate: 15 }, subdistributor: { coin: 1000, rate: 16 }, store: { coin: 500, rate: 18 } },
    { name: "Game Room", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Game Vault", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 15 } },
    { name: "Golden Dragon", distributor: { coin: 500, rate: 25 }, subdistributor: { coin: 0, rate: 0 }, store: { coin: 0, rate: 0 } },
    { name: "Joker", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 15 } },
    { name: "Juwa", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 15 } },
    { name: "Juwa 2.0", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 3000, rate: 14 }, store: { coin: 1000, rate: 15 } },
    { name: "King of Pop", distributor: { coin: 5000, rate: 6 }, subdistributor: { coin: 3000, rate: 7 }, store: { coin: 1000, rate: 8 } },
    { name: "Mafia", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Mega Spin", distributor: { coin: 3000, rate: 11 }, subdistributor: { coin: 1000, rate: 12 }, store: { coin: 1000, rate: 14 } },
    { name: "Milkyway", distributor: { coin: 5000, rate: 17 }, subdistributor: { coin: 1000, rate: 18 }, store: { coin: 500, rate: 19 } },
    { name: "Mr All in One", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Orion Star", distributor: { coin: 3000, rate: 17 }, subdistributor: { coin: 1000, rate: 17 }, store: { coin: 500, rate: 18 } },
    { name: "Panda Master", distributor: { coin: 5000, rate: 14 }, subdistributor: { coin: 1000, rate: 15 }, store: { coin: 500, rate: 16 } },
    { name: "RiverSweep", distributor: { coin: 5000, rate: 15 }, subdistributor: { coin: 1000, rate: 16 }, store: { coin: 500, rate: 17 } },
    { name: "Sirus", distributor: { coin: 5000, rate: 14 }, subdistributor: { coin: 1000, rate: 15 }, store: { coin: 500, rate: 16 } },
    { name: "UltraPanda", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 14 } },
    { name: "VBlink", distributor: { coin: 5000, rate: 14 }, subdistributor: { coin: 1000, rate: 15 }, store: { coin: 500, rate: 16 } },
    { name: "Vegas Roll", distributor: { coin: 1500, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Vegas Sweeps", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 14 } },
    { name: "VegasX", distributor: { coin: 1500, rate: 13 }, subdistributor: { coin: 1000, rate: 14 }, store: { coin: 500, rate: 15 } },
    { name: "Win Star", distributor: { coin: 5000, rate: 6 }, subdistributor: { coin: 1000, rate: 7 }, store: { coin: 500, rate: 8 } },
    { name: "Yolo", distributor: { coin: 5000, rate: 12 }, subdistributor: { coin: 1000, rate: 13 }, store: { coin: 500, rate: 15 } }
  ]
};
if (typeof window !== 'undefined') window.__GCH_DEFAULT_GAME_RATES = SITE_DATA.gameRates ? JSON.parse(JSON.stringify(SITE_DATA.gameRates)) : [];
