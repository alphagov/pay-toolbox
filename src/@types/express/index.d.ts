declare namespace Express {
  // inject additional properties on express.Request
  interface Request {
    session: any;
    originalUrl?: string;
  }
  interface User {
    username?: string;
    admin?: boolean;
  }
}
