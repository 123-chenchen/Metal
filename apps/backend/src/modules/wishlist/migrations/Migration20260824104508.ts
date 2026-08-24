import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260824104508 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "wishlist_item" add column if not exists "image_index" integer not null default 1;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wishlist_item" drop column if exists "image_index";`);
  }

}
