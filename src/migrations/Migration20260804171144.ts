import { Migration } from '@mikro-orm/migrations';

export class Migration20260804171144 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" add column "rating" int null, add column "feedback" varchar(255) null, add column "dispute_reason" varchar(255) null, add column "completed_at" timestamptz null;`);
    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'DISPUTED', 'COMPLETED'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" drop column "rating", drop column "feedback", drop column "dispute_reason", drop column "completed_at";`);

    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED'));`);
  }

}
