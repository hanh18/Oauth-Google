const PORT = process.env.PORT || 3000;

module.export = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "285030563463-s352brs6f3i1old6as666hg91821jhp6.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "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",
  COOKIE_NAME: "auth_token",
  SERVER_ROOT_URI: `http://localhost:${PORT}`
}