module.exports = {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'http://frontend:3000', 'http://localhost:1337'],
    credentials: true,
  },
  webhooks: {
    populateRelations: true,
  },
};
