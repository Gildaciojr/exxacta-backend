import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    console.log("➡️ REQUEST", {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      headers: {
        "x-exxacta-signature": req.headers["x-exxacta-signature"],
      },
    });

    res.on("finish", () => {
      console.log("⬅️ RESPONSE", {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration_ms: Date.now() - start,
      });
    });

    next();
  }
}
