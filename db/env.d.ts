declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    GOOGLE_CLOUD_PROJECT_ID?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    TOKEN_ENCRYPTION_KEY?: string;
  }
}
