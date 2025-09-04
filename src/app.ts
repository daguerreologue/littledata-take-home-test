import express from "express";
import filesRouter from "./routes/files";
import { globalErrorHandler } from "./utils/plumbing/request-handlers";

const app = express();
app.use(
  express.json({
    type: [
      "application/json",
      "application/merge-patch+json"
    ]
  }));

// this is needed as JSON.stringify does not like bigints
app.set(
  "json replacer",
  ((key: string, value: unknown) => typeof value === "bigint" ? value.toString() : value)
);

app.use("/files", filesRouter);
app.use(globalErrorHandler);

export default app;
