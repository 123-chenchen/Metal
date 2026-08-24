import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260820101628 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "featured_grid_item" ("id" text not null, "position" integer not null, "media_url" text not null, "media_file_id" text null, "media_type" text check ("media_type" in ('image', 'video')) not null default 'image', "link_type" text check ("link_type" in ('collection', 'category')) not null, "link_value" text not null, "title" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "featured_grid_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_featured_grid_item_deleted_at" ON "featured_grid_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "hero_banner" ("id" text not null, "image_url" text not null, "image_file_id" text null, "heading" text null, "subheading" text null, "link_type" text check ("link_type" in ('none', 'collection', 'category')) not null default 'none', "link_value" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_hero_banner_deleted_at" ON "hero_banner" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "featured_grid_item" cascade;`);

    this.addSql(`drop table if exists "hero_banner" cascade;`);
  }

}
