# File Metadata Service Challange

This project implements a toy version of a **File Metadata Service**.
Users upload files to cloud storage; the service tracks **metadata** and provides **query APIs**. In reality, file storage and upload is elided as per the challange parameters, the focus is on the metadata subsystem.

Also note that other entities that would be logical to implement, such as users, etc. (and associated functionality such as access token authentication, etc.) are also omitted as they are not mentioned by the challange.

---

## Requirements
- docker
- docker-compose

## Running the Thing
1. To start the services:
  ```bash
  docker-compose up --build
  ```
  This starts localhost database (::5432) and server (::3000) instances.

  Alternatively (such as when running tests):
  ```bash
  npm run db:start && npm run start
  ```

## API Usage Examples

### POST /files
  Uploads file and creates a new file metadata record:

    ```bash
    curl -X POST http://localhost:3000/files \
         -F "file=@/tmp/example.txt" \
         -F "userId=550e8400-e29b-41d4-a716-446655440000" \
         -F "filename=example.txt" \
         -F "tags[]=test" \
    ```

### GET /files/{file_id}
  Gets a file's metadata by its ID:
  
    ```bash
    curl http://localhost:3000/files/ebd1753d-8984-4b95-a4ac-10ffa3d27e89
    ```

### GET /files?user_id=...&tag=...&before=...&limit=...&cursor=...
    Get all files matching request parameters. Since result set is potentially large, cursor pagination is used. The cursor is the ISO 8601 timestamp of the uploaded file (take care to properly URL-encode special characters).

    ```bash
    curl "http://localhost:3000/files?user_id=550e8400-e29b-41d4-a716-446655440000&tag=finance&limit=3&cursor=2025-09-04%2011:27:57.570311%2B00"
    ```

### PATCH /files/{file_id} - replace a file's tags
    Updates the tags of the file (if found) via JSON Merge Patch. 
    
    ```bash
    curl -X PATCH http://localhost:3000/files/cb445d43-f97c-4d47-9213-6a5b36aaa139 \
         -H "Content-Type: application/merge-patch+json" \
         -d '{"tags": ["foo", "bar", "baz"]}' \
    ```

  Note: there is a slight intentional discrepancy from strict RFC 7396, in that null update values (which are sentinel values for deletion as per RFC 7396) will result in the array being emptied instead of nulled (therefore, null is equivalent to []). This is a database design consideration, and can be handled in the query/application layers easily.

## Design Decisions

- I chose postgres due to its guarantees in strong typing, consistency, but especially in indexing, ACID, and relational queries - that for me match the intention of the service, and is expected to scale much better with many files. MongoDB seems like a mismatch for such highly structured metadata and adds complexity for constraints and queries, plus we do not seem to need any of its advantages as per its flexibility.
- Abstractions chosen are appropriately small according to the challange, in the real world a lot more functionality would be reusable and generic, and either stratified more or reusable via Value-Orientation. ORMs are avoided.
- Indexing:
  - B-tree indexing for file ID, user ID, upload time are expected to be the main search variables.
  - GIN index for tags, as they are not too bad for array-contains queries in postgres.
  - Future indexing (depending on user/application and scaling needs) could include: composite indexes for multi-column queries, expression/functional indexes (e.g. case-insensitive filename-search), tsvector for keyword searches.
- Other potential scaling improvements:
  - Range partitioning on upload time, user ID, etc.
  - Sharding along user, user groups (at this point non-existent concept), or other later identifiable "groupables"
  - Caching of hot-items, or recent files, etc. (highly application-dependent!)
  - Depending on usecases, support for bulk uploads and other bulk file operations
  - Monitoring and metrics for identifying other improvement hot-spots and pain areas
- I don't think Event Sourcing is applicable here at all as there is only need for immediate CRUD operations via HTTP. I would consider Event Sourcing if there is a need for a clear audit trail and replayability, and potentially a multi-actor system with decoupled logic and data models.

# Tests & P.S.

I'm afraid I didn't have much time so besides manually testing all endpoints and confirming they all work, I covered only two endpoints (GET files using pagination, and POST for file creation) with some integration tests. These are in no way 100% complete, one could imagine all sorts of bad paths to test. Unit tests would cover more abstract (generic) functionality, and some regions of the code can usually be identified in the real world that greatly benefits from very concise Property-Based Testing.

I hope that's fine and you respect that I don't have a lot of free time to do these take-home tests (worse still, do multiple at once). Ideally, in a day job, one would (really, should) find the time. :)

To run the automated tests, use:

    ```bash
    npm run test
    ```