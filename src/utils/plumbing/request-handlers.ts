import * as zod from "zod";
import * as express from "express";
import { Fn } from "../types/common";
import { propsToCamel } from "../data-manipulation/struct-types";
import { applyIf, given } from "../programmatic/common";
import { logger } from "../../infra/logger";
import { AppError } from "../errors/common";

export const withValidation = <S extends zod.ZodType>(
  schema: S,
  handler: Fn<[zod.infer<S>, express.Request, express.Response], Promise<void>>,
  opts?: { camelise?: boolean }
): express.RequestHandler =>
  (req, res, next) => {
    const { camelise = true } = opts ?? {};
    //TODO: normalisation could be a param but not needed for now
    const input = {
      ...req.body,
      ...req.query,
      ...req.params
    };
    const result =
      given(input)
        .then(applyIf(() => camelise, propsToCamel))
        .then(schema.safeParse)
        .valueOf();

    if (!result.success) {
      res.status(400).json({
        error: "invalid request",
        details: zod.treeifyError(result.error),
        input
      });
    } else {
      handler(result.data, req, res).catch(next);
    }
  };

export const respondWithJsonResults = <A, B>
  (asyncHandler: Fn<[A], Promise<B>>) =>
  async (validated: A, _: express.Request, res: express.Response) => {
    res.json(await asyncHandler(validated));
  };

export const handleAsync =
  (asyncFn: (req: express.Request, res: express.Response, next: express.NextFunction) => any) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      Promise.resolve(asyncFn(req, res, next)).catch(next);

export const globalErrorHandler = (
  error: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  logger.error("Unhandled error in request",
    {
      method: req.method,
      route: req.route?.path ?? req.originalUrl,
      error,
      ...(error instanceof AppError
        ? (error as AppError).meta
        : {}
      )
    });

  res.status(500).json({ error: "internal server error" });
};
