create extension if not exists "uuid-ossp";

create table if not exists filemeta (
    file_id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    filename text not null,
    size_bytes bigint not null,
    content_type text not null,
    upload_time timestamptz not null default now(),
    tags text[] not null default '{}',
    checksum_sha256 char(64) not null
);

create index idx_filemeta_user_id on filemeta(user_id);

create index idx_filemeta_upload_time on filemeta(upload_time desc);

create index idx_filemeta_tags on filemeta using gin (tags);

create index idx_filemeta_user_time on filemeta(user_id, upload_time desc);
