export const appConfig = Object.freeze({
  apiV1: "/api/v1",
  port: process.env.PORT,
  release: process.env.RELEASE,
  jwtSecret: process.env.SECRET,
  appDb: process.env.DB_CONNECTOR,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM
});
