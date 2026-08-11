import type { Request, Response, NextFunction } from "express";
import { type ZodTypeAny, ZodError } from "zod";

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: "Invalid query parameters" });
    }
  };
};

export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid route parameters",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: "Invalid route parameters" });
    }
  };
};
