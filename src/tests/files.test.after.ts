import request from "supertest";
import app from "../app";
import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
import path from "path";
import { db } from "../db";
import { v4 as uuidv4 } from "uuid";

const uuidv4rx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 🔧 Global cleanup for DB state + connection
afterAll(async () => {
  await db.query(`delete from filemeta`);
  await db.close?.(); // ensure connections are closed if supported
});

describe("POST /files", () => {
  const fixtureDir = path.join(__dirname, "fixtures");
  const validFilePath = path.join(fixtureDir, "example.txt");
  const invalidFilePath = path.join(fixtureDir, "nonexistent.txt");

  it("should upload a file successfully and get its assigned ID as a result", async () => {
    const res = await request(app)
      .post("/files")
      .field("userId", "550e8400-e29b-41d4-a716-446655440000")
      .field("filename", "example.txt")
      .field("tags[]", "notes")
      .attach("file", validFilePath);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("string");          // now only the fileId
    expect(res.body).toMatch(uuidv4rx);
  });

  it("should fail if no file is provided", async () => {
    const res = await request(app)
      .post("/files")
      .field("userId", "550e8400-e29b-41d4-a716-446655440000")
      .field("filename", "nofile.txt")
      .field("tags[]", "notes");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "file missing");
  });

  it("should fail if file path does not exist", async () => {
    // 🔧 Make the failure explicit instead of manual try/catch
    await expect(
      request(app)
        .post("/files")
        .field("userId", "550e8400-e29b-41d4-a716-446655440000")
        .attach("file", invalidFilePath)
    ).rejects.toThrow();
  });
});

describe("GET /files with cursor pagination", () => {
  const userId = uuidv4();
  const pageSize = 3;
  const totalFiles = 10;
  const fileIds: string[] = [];

  beforeAll(async () => {
    // insert some files
    for (let i = 0; i < totalFiles; i++) {
      const res = await db.query<{ fileId: string }>(
        `insert into filemeta (
          file_id,
          user_id,
          filename,
          size_bytes,
          content_type,
          upload_time,
          tags,
          checksum_sha256
        )
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning file_id`,
        {
          params: [
            uuidv4(),
            userId,
            `file-${i}.txt`,
            1024n,
            "text/plain",
            new Date(Date.now() + i * 1000 * 60 * 60).toISOString(),
            ["test"],
            "dummy-checksum"
          ]
        }
      );
      if (res == undefined || res.length == 0) {
        throw new Error("something wrong with test file gen");
      } else {
        fileIds.push(res[0]!.fileId);
      }
    }
  });

  it("should paginate through all files using nextCursor", async () => {
    let nextCursor: string | undefined = undefined;
    let seenIds = new Set<string>();

    do {
      const url = `/files?user_id=${userId}&limit=${pageSize}` + (nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : "");
      const res = await request(app).get(url);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeLessThanOrEqual(pageSize);

      for (const file of res.body.items) {
        expect(file.userId).toBe(userId);
        expect(fileIds).toContain(file.fileId);
        seenIds.add(file.fileId);
      }

      nextCursor = res.body.nextCursor;
    } while (nextCursor);

    expect(seenIds.size).toBe(totalFiles);
  });
});
