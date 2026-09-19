const getSecret = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }

  return value || fallback;
};

export default {
  secret: getSecret("JWT_SECRET", "mysecret"),
  expiresIn: "15m",
  refreshSecret: getSecret("JWT_REFRESH_SECRET", "myanothersecret"),
  refreshExpiresIn: "7d"
};
