import { Migration } from '@mikro-orm/migrations';

export class Migration20260519190634 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "task_bid_negotiations" ("id" serial primary key, "task_bid_id" int not null, "amount" decimal(10,2) not null, "message" varchar(255) null, "created_by_id" int not null, "role" text check ("role" in ('CLIENT', 'RUNNER')) not null, "created_at" timestamptz not null);`);

    this.addSql(`alter table "task_bid_negotiations" add constraint "task_bid_negotiations_task_bid_id_foreign" foreign key ("task_bid_id") references "task_bid" ("id") on update cascade;`);

    this.addSql(`alter table "task_bid" drop constraint if exists "task_bid_status_check";`);

    this.addSql('alter table "task_bid" add column "counter_offer" int null;');
    this.addSql(`alter table "task_bid" add constraint "task_bid_status_check" check("status" in ('PENDING', 'COUNTERED_BY_CLIENT', 'COUNTERED_BY_RUNNER', 'ACCEPTED', 'REJECTED'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "task_bid_negotiations" cascade;`);

    this.addSql(`alter table "task_bid" drop constraint if exists "task_bid_status_check";`);

    this.addSql(`alter table "task_bid" drop column "counter_offer";`);

    this.addSql(`alter table "task_bid" add constraint "task_bid_status_check" check("status" in ('PENDING', 'ACCEPTED', 'REJECTED'));`);
  }

}
