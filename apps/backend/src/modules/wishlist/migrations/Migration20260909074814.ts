import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260909074814 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "wishlist_item" add column if not exists "design_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "wishlist_item" drop column if exists "design_id";`);
  }

}
