import { Migration } from '@mikro-orm/migrations';

export class Migration20260803133151 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task_bid_negotiations" add constraint "task_bid_negotiations_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task_bid_negotiations" drop constraint "task_bid_negotiations_created_by_id_foreign";`);
  }

}
