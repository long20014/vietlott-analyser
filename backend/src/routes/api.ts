import { Router, Request, Response } from 'express';

export const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Vietlott Analyser API' });
});
