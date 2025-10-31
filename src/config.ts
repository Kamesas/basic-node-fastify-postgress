function loadConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  const databaseUrl = process.env.DATABASE_URL;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET environment variable is required and must be changed from default"
    );
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || "development",
    databaseUrl,
    jwtSecret,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "30d",
    argonMemoryCost: Number(process.env.ARGON_MEMORY_COST || 65536),
    argonTimeCost: Number(process.env.ARGON_TIME_COST || 3),
    argonParallelism: Number(process.env.ARGON_PARALLELISM || 4),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    email: {
      from: process.env.FROM_EMAIL || "books.com",
      user: process.env.EMAIL_USER || "94007118947e14",
      pass: process.env.EMAIL_PASS || "ced5f01bba6d07",
      host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
      port: Number(process.env.EMAIL_PORT || 2525),
    },
  };
}

export const config = loadConfig();

export const isProduction = config.nodeEnv === "production";
export const isDevelopment = config.nodeEnv === "development";
export const isTest = config.nodeEnv === "test";
