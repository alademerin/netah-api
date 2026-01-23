import { Migration } from '@mikro-orm/migrations';

export class Migration20260120221110 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "task_bid" ("id" serial primary key, "amount" int not null, "message" varchar(255) not null, "status" text check ("status" in ('PENDING', 'ACCEPTED', 'REJECTED')) not null default 'PENDING', "created_by_id" int not null, "task_id" int not null, "created_at" timestamptz not null, "deleted_at" timestamptz null);`);
    this.addSql(`alter table "task_bid" add constraint "task_bid_task_id_created_by_id_unique" unique ("task_id", "created_by_id");`);

    this.addSql(`alter table "task_bid" add constraint "task_bid_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "task_bid" add constraint "task_bid_task_id_foreign" foreign key ("task_id") references "task" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "task_bid" cascade;`);
  }

}
