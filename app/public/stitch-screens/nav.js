(function () {
  var HOME_URL = "/storefront/home";
  var map = {
    home: HOME_URL,
    inicio: HOME_URL,
    shop: "/storefront/catalog",
    collections: "/storefront/catalog",
    catalog: "/storefront/catalog",
    carrito: "/storefront/cart",
    cart: "/storefront/cart",
    checkout: "/storefront/checkout",
    dashboard: "/admin/dashboard",
    products: "/admin/products",
    orders: "/admin/orders",
    customers: "/admin/customers",
    settings: "/admin/settings/store",
    marketing: "/admin/marketing",
    reports: "/admin/reports/best-sellers",
    users: "/admin/users/roles",
    ssl: "/admin/ssl",
    media: "/admin/media"
  };

  function resolve(text) {
    var t = (text || "").toLowerCase().trim();
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i += 1) {
      if (t.indexOf(keys[i]) !== -1) return map[keys[i]];
    }
    return null;
  }

  function ensureHomeFab() {
    if (document.getElementById("home-fab")) return;
    var a = document.createElement("a");
    a.id = "home-fab";
    a.href = HOME_URL;
    a.setAttribute("aria-label", "Volver al inicio");
    a.textContent = "Inicio";
    a.style.position = "fixed";
    a.style.right = "16px";
    a.style.bottom = "16px";
    a.style.zIndex = "9999";
    a.style.padding = "10px 14px";
    a.style.borderRadius = "999px";
    a.style.background = "#ee2b6c";
    a.style.color = "#fff";
    a.style.fontWeight = "700";
    a.style.textDecoration = "none";
    a.style.boxShadow = "0 8px 24px rgba(238,43,108,0.35)";
    document.body.appendChild(a);
  }

  function ensureBrandLinks() {
    var candidates = document.querySelectorAll("h1, h2, .brand, [data-brand]");
    candidates.forEach(function (node) {
      var text = (node.textContent || "").toLowerCase();
      if (text.indexOf("milfshakes") === -1) return;
      if (node.closest("a")) return;
      var link = document.createElement("a");
      link.href = HOME_URL;
      link.style.color = "inherit";
      link.style.textDecoration = "none";
      node.parentNode.insertBefore(link, node);
      link.appendChild(node);
    });
  }

  function mapPlaceholderLinks() {
    var links = document.querySelectorAll('a[href="#"]');
    links.forEach(function (a) {
      var route = resolve(a.textContent);
      if (route) a.setAttribute("href", route);
    });
  }

  mapPlaceholderLinks();
  ensureBrandLinks();
  ensureHomeFab();
})();
