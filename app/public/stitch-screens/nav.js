(function () {
  var map = {
    shop: "/storefront/catalog",
    collections: "/storefront/catalog",
    about: "/storefront/home",
    contact: "/storefront/home",
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

  var links = document.querySelectorAll('a[href="#"]');
  links.forEach(function (a) {
    var route = resolve(a.textContent);
    if (route) a.setAttribute("href", route);
  });
})();
