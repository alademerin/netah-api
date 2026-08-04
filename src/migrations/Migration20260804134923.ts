import { Migration } from '@mikro-orm/migrations';

export class Migration20260804134923 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'ASSIGNED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED'));`);
  }

}
