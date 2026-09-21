import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260909073544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "design_asset" drop constraint if exists "design_asset_url_unique";`);
    this.addSql(`alter table if exists "design" drop constraint if exists "design_product_id_legacy_image_id_unique";`);
    this.addSql(`alter table if exists "design" drop constraint if exists "design_product_id_sequence_unique";`);
    this.addSql(`alter table if exists "design" drop constraint if exists "design_request_key_unique";`);
    this.addSql(`alter table if exists "design" drop constraint if exists "design_handle_unique";`);
    this.addSql(`create table if not exists "design" ("id" text not null, "product_id" text not null, "sequence" integer not null, "title" text not null, "handle" text not null, "active" boolean not null default true, "archived" boolean not null default false, "version" integer not null default 1, "legacy_image_id" text null, "legacy_index" integer null, "artwork_url" text not null, "artwork_file_id" text null, "shape" text check ("shape" in ('vertical', 'horizontal', 'hexagon', 'multi-panel')) not null default 'vertical', "crop" jsonb not null, "gallery" jsonb not null, "retained_urls" jsonb not null, "request_key" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "design_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_design_handle_unique" ON "design" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_design_request_key_unique" ON "design" ("request_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_design_deleted_at" ON "design" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_design_product_id_sequence_unique" ON "design" ("product_id", "sequence") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_design_product_id_legacy_image_id_unique" ON "design" ("product_id", "legacy_image_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "design_asset" ("id" text not null, "url" text not null, "file_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "design_asset_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_design_asset_url_unique" ON "design_asset" ("url") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_design_asset_deleted_at" ON "design_asset" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "design" cascade;`);

    this.addSql(`drop table if exists "design_asset" cascade;`);
  }

}
