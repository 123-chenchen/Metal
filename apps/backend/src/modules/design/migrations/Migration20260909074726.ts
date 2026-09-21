import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260909074726 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "design" drop constraint if exists "design_shape_check";`);

    this.addSql(`alter table if exists "design" add constraint "design_shape_check" check("shape" in ('original', 'vertical', 'horizontal', 'hexagon', 'multi-panel'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "design" drop constraint if exists "design_shape_check";`);

    this.addSql(`alter table if exists "design" add constraint "design_shape_check" check("shape" in ('vertical', 'horizontal', 'hexagon', 'multi-panel'));`);
  }

}
