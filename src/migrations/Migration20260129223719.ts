import { Migration } from '@mikro-orm/migrations';

export class Migration20260129223719 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" add column "bids_count" int not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop column "bids_count";`);
  }

}
