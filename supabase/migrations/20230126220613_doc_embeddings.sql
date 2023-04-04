create extension if not exists vector with schema public;

create table "public"."page" (
  id bigserial primary key,
  path text not null unique,
  checksum text,
  meta jsonb
);
alter table "public"."page" enable row level security;

create table "public"."page_section" (
  id bigserial primary key,
  page_id bigint not null references public.page on delete cascade,
  content text,
  token_count int,
  embedding vector(1536)
);
alter table "public"."page_section" enable row level security;
