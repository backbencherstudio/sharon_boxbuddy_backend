declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      facebook_id: string;
    };
    rawBody: any;
  }
}
