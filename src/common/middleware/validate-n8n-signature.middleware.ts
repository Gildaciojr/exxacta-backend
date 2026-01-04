import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ValidateN8nSignatureMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const signature = req.header("x-exxacta-signature");
    const secret = process.env.EXXACTA_N8N_SECRET;

    if (!secret) {
      throw new UnauthorizedException(
        "Servidor sem EXXACTA_N8N_SECRET configurado"
      );
    }

    if (!signature || signature !== secret) {
      throw new UnauthorizedException("Assinatura inválida");
    }

    next();
  }
}
