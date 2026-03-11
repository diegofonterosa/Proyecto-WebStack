(function () {
  var HOME_URL = "/storefront/home";
  var CART_URL = "/storefront/cart";
  var CATALOG_URL = "/storefront/catalog";
  var LOGIN_URL = "/login";
  var map = {
    home: HOME_URL,
    inicio: HOME_URL,
    shop: CATALOG_URL,
    collections: CATALOG_URL,
    catalog: CATALOG_URL,
    lookbook: CATALOG_URL,
    carrito: CART_URL,
    cart: CART_URL,
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

  function goTo(url) {
    window.location.href = url;
  }

  function wireIconButtons() {
    var buttons = document.querySelectorAll("button");
    buttons.forEach(function (btn) {
      if (btn.dataset.wired === "1") return;
      var icon = btn.querySelector(".material-symbols-outlined");
      if (!icon) return;
      var iconName = (icon.textContent || "").trim().toLowerCase();

      if (iconName === "shopping_bag") {
        btn.dataset.wired = "1";
        btn.addEventListener("click", function () {
          goTo(CART_URL);
        });
      }

      if (iconName === "person") {
        btn.dataset.wired = "1";
        btn.addEventListener("click", function () {
          goTo(LOGIN_URL);
        });
      }

      if (iconName === "favorite") {
        btn.dataset.wired = "1";
        btn.addEventListener("click", function () {
          goTo(CATALOG_URL);
        });
      }
    });

    var avatars = document.querySelectorAll("[data-alt*='profile'], [data-alt*='avatar']");
    avatars.forEach(function (avatar) {
      if (avatar.dataset.wired === "1") return;
      avatar.dataset.wired = "1";
      avatar.style.cursor = "pointer";
      avatar.addEventListener("click", function () {
        goTo(LOGIN_URL);
      });
    });
  }

  function wireHeroCtas() {
    var buttons = document.querySelectorAll("button");
    buttons.forEach(function (btn) {
      if (btn.dataset.ctaWired === "1") return;
      var text = (btn.textContent || "").toLowerCase().trim();
      if (text === "shop now") {
        btn.dataset.ctaWired = "1";
        btn.addEventListener("click", function () {
          goTo(CATALOG_URL);
        });
      }
      if (text === "view lookbook") {
        btn.dataset.ctaWired = "1";
        btn.addEventListener("click", function () {
          goTo(CATALOG_URL);
        });
      }
    });
  }

  function wireSizeButtons() {
    var headers = document.querySelectorAll("h3");
    headers.forEach(function (h3) {
      if ((h3.textContent || "").toLowerCase().trim() !== "size") return;
      var wrap = h3.nextElementSibling;
      if (!wrap) return;
      var buttons = wrap.querySelectorAll("button");
      buttons.forEach(function (btn) {
        if (btn.dataset.sizeWired === "1") return;
        btn.dataset.sizeWired = "1";
        btn.addEventListener("click", function () {
          buttons.forEach(function (b) {
            b.classList.remove("border-2", "border-primary", "bg-primary/5", "text-primary", "font-bold");
            b.classList.add("border", "border-slate-200", "dark:border-slate-700");
          });
          btn.classList.remove("border", "border-slate-200", "dark:border-slate-700");
          btn.classList.add("border-2", "border-primary", "bg-primary/5", "text-primary", "font-bold");
          window.__selectedSize = (btn.textContent || "").trim();
        });
      });
    });
  }

  async function buildProductIndex() {
    if (window.__catalogIndex) return window.__catalogIndex;
    if (typeof getProductos !== "function") return {};
    try {
      var resp = await getProductos(1, 100);
      var list = Array.isArray(resp && resp.datos) ? resp.datos : [];
      var index = {};
      list.forEach(function (p) {
        if (!p || !p.nombre) return;
        index[p.nombre.toLowerCase().trim()] = p.id;
      });
      window.__catalogIndex = index;
      return index;
    } catch {
      return {};
    }
  }

  async function wireQuickAddButtons() {
    var index = await buildProductIndex();
    var buttons = document.querySelectorAll("button");
    buttons.forEach(function (btn) {
      if (btn.dataset.addWired === "1") return;
      var txt = (btn.textContent || "").toLowerCase();
      var icon = btn.querySelector(".material-symbols-outlined");
      var iconName = icon ? (icon.textContent || "").trim().toLowerCase() : "";
      var isAdd = txt.indexOf("quick add") !== -1 || iconName === "add_shopping_cart";
      if (!isAdd) return;

      btn.dataset.addWired = "1";
      btn.addEventListener("click", function (event) {
        var inlineHandler = btn.getAttribute("onclick") || "";
        if (inlineHandler.indexOf("agregarAlCarritoUI(") !== -1) {
          // Deja que el handler inline (con ID explícito) haga su trabajo.
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        var card = btn.closest(".group") || btn.closest("div");
        var title = card ? card.querySelector("h4") : null;
        var name = title ? (title.textContent || "").toLowerCase().trim() : "";
        var productId = btn.dataset.productId || index[name];

        if (typeof window.agregarAlCarritoUI === "function" && productId) {
          window.agregarAlCarritoUI(Number(productId));
          return;
        }

        if (productId) {
          goTo(CART_URL);
        }
      });
    });
  }

  function observeCatalogChanges() {
    var grid = document.getElementById("productos-grid");
    if (!grid || typeof MutationObserver === "undefined") return;
    var observer = new MutationObserver(function () {
      wireIconButtons();
      wireQuickAddButtons();
    });
    observer.observe(grid, { childList: true, subtree: true });
  }

  mapPlaceholderLinks();
  ensureBrandLinks();
  ensureHomeFab();
  wireIconButtons();
  wireHeroCtas();
  wireSizeButtons();
  wireQuickAddButtons();
  observeCatalogChanges();
})();
