import { Migration } from '@mikro-orm/migrations';

export class Migration20260113153233 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "task" add column "reward" int not null, add column "status" text check ("status" in ('OPEN', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED')) not null default 'OPEN', add column "posted_by_id" int not null, add column "assigned_to_id" int null, add column "created_at" timestamptz not null, add column "deleted_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "task" add constraint "task_posted_by_id_foreign" foreign key ("posted_by_id") references "user" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "task" add constraint "task_assigned_to_id_foreign" foreign key ("assigned_to_id") references "user" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "task" drop constraint "task_posted_by_id_foreign";`,
    );
    this.addSql(
      `alter table "task" drop constraint "task_assigned_to_id_foreign";`,
    );

    this.addSql(
      `alter table "task" drop column "reward", drop column "status", drop column "posted_by_id", drop column "assigned_to_id", drop column "created_at", drop column "deleted_at";`,
    );
  }
}
