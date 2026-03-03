module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['insecurekey1', 'insecurekey2']),
  },
  webhooks: {
    events: {
      'api::producto.producto.created': true,
      'api::producto.producto.updated': true,
      'api::producto.producto.deleted': true,
      'api::banner.banner.created': true,
      'api::banner.banner.updated': true,
    },
  },
});
