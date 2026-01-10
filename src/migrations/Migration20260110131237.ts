import { Migration } from '@mikro-orm/migrations';

export class Migration20260110131237 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "deleted_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "deleted_at";`);
  }

}
