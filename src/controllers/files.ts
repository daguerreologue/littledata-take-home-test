import { fileMeta } from "../models/filemeta";
import * as zod from "zod";
import { respondWithJsonResults, withValidation } from "../utils/plumbing/request-handlers";
import { coercedBigInt } from "../utils/plumbing/validation-helpers";
import * as express from "express"
import { AppError } from "../utils/errors/common";
import { createHash } from "crypto";
import type { Express } from "express";
import type { Multer } from "multer";
import { pick } from "../utils/data-manipulation/struct-types";

//TODO: refactor to more declarative schema + queryFn table via common withValidation transformer (if there's even a way that's not a typing nightmare without true RPM + HKT)
// note: schemata are exported separately and not inlined into the handler declarations to enable REPL-based debugging
export const createFileSchema = zod.object({
  userId: zod.uuidv4(),
  filename: zod.string(),
  tags: zod.string().array().default([])
});
export const createFile =
  withValidation(
    createFileSchema,
    async (
      validated: zod.infer<typeof createFileSchema>,
      req: express.Request & express.Request & { file?: Express.Multer.File },
      res: express.Response
    ): Promise<void> => {
      if (req.file == undefined) {
        res.status(400).json({ error: "file missing" })
      } else {
        const checksumSha256 =
          createHash("sha256")
            .update(req.file.buffer)
            .digest("hex");

        const fileRecord = await fileMeta.create({
          userId: validated.userId,
          filename: validated.filename ?? req.file.originalname,
          sizeBytes: BigInt(req.file.size),
          contentType: req.file.mimetype,
          tags: validated.tags ?? [],
          checksumSha256,
        });

        res.json(fileRecord);
      }
    }
  );

export const getFileByIdSchema = zod.object({
  fileId: zod.uuidv4()
});
export const getFileById =
  withValidation(
    getFileByIdSchema,
    respondWithJsonResults(fileMeta.get)
  );

export const updateTagsSchema = zod.object({
  fileId: zod.uuidv4(),
  tags: zod.string().array().nullable() // null -> delete, as per JSON Merge Patch
});
export const updateTags =
  withValidation(
    updateTagsSchema,
    respondWithJsonResults(fileMeta.updateTags)
  );

export const queryFilesSchema = zod.object({
  userId: zod.uuidv4(),
  tag: zod.string().optional(),
  before: zod.iso.datetime().optional(),
  cursor: zod.string().optional(),
  limit: zod.coerce.number().min(1).max(100).default(20),
});
export const queryFiles =
  withValidation(
    queryFilesSchema,
    respondWithJsonResults(fileMeta.getRange)
  )
