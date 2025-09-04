import { Router } from "express";
import * as controller from "../controllers/files";
import { handleAsync } from "../utils/plumbing/request-handlers";
import multer from "multer";
import { createFile, getFileById, queryFiles, updateTags } from "../controllers/files";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", handleAsync(upload.single("file")), createFile);
// router.post("/", handleAsync(createFile));
router.get("/:file_id", handleAsync(getFileById));
router.get("/", handleAsync(queryFiles));
router.patch("/:file_id", handleAsync(updateTags));

export default router;
