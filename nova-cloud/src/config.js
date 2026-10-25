require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3847', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./data/nova-cloud.db',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'nova-dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'nova-dev-refresh-secret-change-in-production',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d'
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Nova Browser <noreply@novabrowser.app>'
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  searchCacheTtl: parseInt(process.env.SEARCH_CACHE_TTL || '3600', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',')
};
