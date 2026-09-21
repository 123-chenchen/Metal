import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260921085817 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "hero_settings" ("id" text not null, "config" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_hero_settings_deleted_at" ON "hero_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "hero_settings" cascade;`);
  }

}
