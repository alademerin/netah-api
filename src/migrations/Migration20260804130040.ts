import { Migration } from '@mikro-orm/migrations';

export class Migration20260804130040 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "system_settings" ("id" serial primary key, "key" varchar(255) not null, "value" varchar(255) not null, "description" varchar(255) null, "updated_at" timestamptz not null, "created_at" timestamptz not null);`);
    this.addSql(`alter table "system_settings" add constraint "system_settings_key_unique" unique ("key");`);

    this.addSql(`create table "payments" ("id" serial primary key, "task_bid_id" int not null, "paid_by_id" int not null, "bid_amount" decimal(10,2) not null, "service_charge" decimal(10,2) not null, "total_amount" decimal(10,2) not null, "payment_reference" varchar(255) not null, "status" text check ("status" in ('PENDING', 'COMPLETED', 'FAILED')) not null default 'PENDING', "created_at" timestamptz not null, "completed_at" timestamptz null);`);

    this.addSql(`alter table "payments" add constraint "payments_task_bid_id_foreign" foreign key ("task_bid_id") references "task_bid" ("id") on update cascade;`);
    this.addSql(`alter table "payments" add constraint "payments_paid_by_id_foreign" foreign key ("paid_by_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'ASSIGNED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "system_settings" cascade;`);

    this.addSql(`drop table if exists "payments" cascade;`);

    this.addSql(`alter table "task" drop constraint if exists "task_status_check";`);

    this.addSql(`alter table "task" add constraint "task_status_check" check("status" in ('OPEN', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED'));`);
  }

}
