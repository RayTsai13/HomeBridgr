-- Recreate postcard_collections with fields to store 2x2 postcard data
-- Safe for Supabase/Postgres. Requires pgcrypto for gen_random_uuid().

begin;

create extension if not exists pgcrypto;

drop table if exists postcard_collections;

create table postcard_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('public','private')),
  created_by text not null,
  created_at timestamptz not null default now(),

  -- Postcard content
  items jsonb,                -- array of 4 objects: { post_id, image_url, caption, author_id, author_name }
  post_ids text[],            -- convenience list of included post ids
  fingerprint text,           -- stable identity for this set (e.g., sorted post_ids joined by '|')
  source text not null default 'auto', -- 'auto' | 'manual'
  metadata jsonb              -- optional extras
);

create unique index if not exists postcard_collections_created_by_fingerprint_idx
  on postcard_collections (created_by, fingerprint);

create index if not exists postcard_collections_created_at_idx
  on postcard_collections (created_at desc);

commit;
