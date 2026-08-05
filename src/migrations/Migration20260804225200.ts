import { Migration } from '@mikro-orm/migrations';

export class Migration20260804225200 extends Migration {

  override async up(): Promise<void> {
    // Drop existing unique constraint
    this.addSql(`alter table "task_bid" drop constraint "task_bid_task_id_created_by_id_unique";`);

    // Create partial unique index that only enforces uniqueness for non-deleted bids
    this.addSql(`create unique index "task_bid_task_id_created_by_id_active_unique" on "task_bid" ("task_id", "created_by_id") where "deleted_at" is null;`);
  }

  override async down(): Promise<void> {
    // Drop partial unique index
    this.addSql(`drop index "task_bid_task_id_created_by_id_active_unique";`);

    // Restore original unique constraint
    this.addSql(`alter table "task_bid" add constraint "task_bid_task_id_created_by_id_unique" unique ("task_id", "created_by_id");`);
  }

}
