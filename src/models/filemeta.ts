import { db } from "../db";
import { logger } from "../infra/logger";
import { Camelise, select } from "../utils/data-manipulation/struct-types";
import { AppError } from "../utils/errors/common";
import { StringRepr } from "../utils/types/doctypes";
import mergePatch from "json-merge-patch";

export type FileMetaRow = {
  file_id: StringRepr<"UUID v4">;
  user_id: StringRepr<"UUID v4">;
  filename: string;
  size_bytes: bigint;
  content_type: string;
  upload_time: StringRepr<"ISO 8601 timestamp">;
  tags: string[];
  checksum_sha256: StringRepr<"SHA-256">;
};
export type FileMeta = Camelise<FileMetaRow>;

export const fileMeta = {
  create: async (
    data: Pick<FileMeta,
      'userId' |
      'filename' |
      'sizeBytes' |
      'contentType' |
      'tags' |
      'checksumSha256'>
  ) => {
    const rows = await db.query<{ fileId: string }>(
      `insert into filemeta (user_id,
                    filename,
                    size_bytes,
                    content_type,
                    tags,
                    checksum_sha256
                  )
       values ($1, $2, $3, $4, $5, $6)
       returning file_id`,
      { params: select(['userId', 'filename', 'sizeBytes', 'contentType', 'tags', 'checksumSha256'], data) }
    );

    if (!rows[0]?.fileId) {
      throw new AppError("failed to create file metadata", { requested: data });
    }

    return rows[0].fileId;
  },

  get: async ({ fileId }: { fileId: StringRepr<"UUID v4"> }) => {
    const rows = await db.query<FileMeta>(
      `select *
       from filemeta
       where file_id = $1
       limit 1`,
      { params: [fileId], onEmptyResult: () => [] }
    );
    return rows?.[0];
  },

  getRange: async ({ userId, tag, cursor, limit }: {
    userId: StringRepr<"UUID v4">;
    tag?: string;
    cursor?: StringRepr<"ISO 8601 timestamp">;
    limit: number;
  }) => {
    const rows = await db.query<FileMeta>(
      `select * from filemeta
      where user_id = $1
      and (($2::text is null) or (tags @> array[$2]))
      and (($3::timestamptz is null) or (upload_time < $3))
      order by upload_time desc
      limit $4`,
      { params: [userId, tag ?? null, cursor ?? null, limit] }
    );
    // logger.log("DEBUG getRange", { cursor, limit, rows });

    return {
      items: rows,
      nextCursor:
        rows.length === limit
          ? rows[rows.length - 1]?.uploadTime
          : undefined
    };
  },

  // note: as the tags array is simply replaced as per JSON Merge Patch, we need not call into generic external json-merge-patch code
  updateTags: async ({ fileId, tags }: {
    fileId: StringRepr<"UUID v4">,
    tags: string[] | null;
  }) => {
    const updateResultRows = await db.query<{ fileId: string; tags: string[] }>(
      `update filemeta
       set tags = $1
       where file_id = $2
       returning file_id, tags`,
      { params: [tags ?? [], fileId] }
    );

    return updateResultRows?.[0];
  }
};