# 📝 Senior Backend Take-Home Challenge (Node.js + TypeScript)

## Context
Build a simplified **File Metadata Service**. Users upload files to cloud storage; your service tracks **metadata** and provides **query APIs**.  
You do **not** need to implement real S3/GCS/Azure uploads—mock storage is fine. Focus on the metadata backend.

---

## Requirements

### 1) Metadata Model
Each file should have at least:
- `file_id` (UUID)
- `user_id`
- `filename`
- `size_bytes`
- `content_type`
- `upload_time` (ISO timestamp)
- `tags` (array of strings)
- `checksum_sha256`

> ⚠️ Note: `checksum_sha256` must be **populated appropriately**, even though it is **not** explicitly referenced in the API specs below. Decide where this belongs in the flow and document your decision.

**Database naming:** The table/collection name must be exactly **`filemeta`**.

---

### 2) APIs to Implement (REST)
- `POST /files` → Create a metadata record.  
- `GET /files/{id}` → Retrieve metadata by ID.  
- `GET /files?user_id=...&tag=...&before=...` → Query by filters.  
  - **Must support pagination.**  
- `PATCH /files/{id}` → Update metadata **tags**.
  - Use **JSON Merge Patch (RFC 7396)**.
  - Do **not** use JSON Patch (RFC 6902).

> Include appropriate validation, error handling, and useful HTTP status codes.

---

## Tech Constraints

### Language & Runtime
- **Node.js** (LTS) with **TypeScript**.

### Frameworks (choose one)
- Express, Fastify, or NestJS.

### Data Layer (choose one and justify)
- **PostgreSQL** (recommended driver: `pg` or a light query builder like `knex`)
- **MongoDB** (recommended: official `mongodb` driver)

> ⚠️ Avoid heavy ORMs/ODMs for this exercise. **Do not use Prisma or Mongoose.** Show you can design schemas and indexes directly.

### Testing
- Add automated tests (e.g., **Jest** + **supertest**) for **at least one endpoint**.

### Packaging & Run
- Provide **Docker Compose** to run the service and the database locally.
- Include `npm` scripts for `dev`, `test`, and `start`.

### Code Quality
- Include `tsconfig.json`, basic ESLint, and a minimal folder structure (e.g., `src/`, `tests/`).

---

## Pagination Requirement
Support **pagination** on `GET /files`:
- You may implement **cursor** (preferred) or **offset/limit** pagination.
- Return pagination metadata in responses (e.g., `next_cursor` or `total/limit/offset`).

Document the trade-offs you chose.

---

## Indexing & Querying
Design and document your indexes (e.g., by `user_id`, `upload_time`, `tags`).  
Show how queries scale to millions of records (write down your reasoning and limits).

---

## Deliverables
- Source code (GitHub repo or zip).
- `README.md` with:
  - How to run locally (Docker Compose steps).
  - API description (examples with `curl` or an `.http`/Postman collection).
  - Architecture decisions:
    - Why PostgreSQL vs MongoDB for this problem.
    - If MongoDB: when you would **embed vs reference** and why.
  - Indexing strategy and expected query patterns.
  - How you would scale to millions of files (sharding/partitioning, hot paths, caching).
  - **Why you did *not* choose Event Sourcing** for this project.

---

## Non-Functional Expectations
- Clear, maintainable code structure.
- Thoughtful errors (don’t leak internals).
- Reasonable input validation.
- Idempotency considerations where relevant (e.g., safe retries for `POST`).

---

## Evaluation Criteria
- **Correctness:** API behavior matches spec; `filemeta` naming is respected.
- **Senior Thinking:** Solid schema + indexes; pagination that won’t crumble at scale.
- **API Quality:** Status codes, error shapes, validation.
- **Tests:** Useful and focused.
- **Documentation:** Clear, concrete reasoning—especially around data model & scaling.
- **Adherence to constraints:** JSON **Merge** Patch (RFC 7396), **no Prisma/Mongoose**, correct table/collection name.

---

## Notes / Hints
- You may simulate checksum computation on create/update flows.
- Keep scope focused—production polish is unnecessary; correctness and reasoning matter most.
- Small but thoughtful code > big generated scaffolds.


