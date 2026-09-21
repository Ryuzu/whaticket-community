import type { SignOptions } from "jsonwebtoken";

const getSecret = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }

  return value || fallback;
};

const accessExpiresIn: SignOptions["expiresIn"] = "15m";
const refreshExpiresIn: SignOptions["expiresIn"] = "7d";

export default {
  secret: getSecret("JWT_SECRET", "mysecret"),
  expiresIn: accessExpiresIn,
  refreshSecret: getSecret("JWT_REFRESH_SECRET", "myanothersecret"),
  refreshExpiresIn
};
