import { Migration } from '@mikro-orm/migrations';

export class Migration20260918122600 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" alter column "location" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" alter column "location" set not null;`);
  }

}
