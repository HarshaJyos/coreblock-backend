// src/types/xss-clean.d.ts
declare module 'xss-clean' {
    import { Request, Response, NextFunction } from 'express';

    // xss-clean is a function that returns the middleware
    const xssClean: () => (req: Request, res: Response, next: NextFunction) => void;

    export default xssClean;
}
