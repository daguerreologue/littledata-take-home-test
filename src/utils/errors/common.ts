export class AppError<Metadata extends Record<string, any> = {}> extends Error {
  constructor(
    readonly message: string,
    readonly meta: Metadata = {} as Metadata,
    readonly statusCode = 500) {
    super(message);
    this.name = 'AppError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
