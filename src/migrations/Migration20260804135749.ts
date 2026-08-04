import { Migration } from '@mikro-orm/migrations';

export class Migration20260804135749 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "notifications" ("id" serial primary key, "user_id" int not null, "type" text check ("type" in ('NEW_BID', 'COUNTER_OFFER_CLIENT', 'COUNTER_OFFER_RUNNER', 'BID_ACCEPTED', 'BID_REJECTED', 'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'DUE_DATE_REMINDER')) not null, "title" varchar(255) not null, "message" varchar(255) not null, "task_id" int null, "task_bid_id" int null, "is_read" boolean not null default false, "created_at" timestamptz not null, "read_at" timestamptz null);`);

    this.addSql(`alter table "notifications" add constraint "notifications_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "notifications" add constraint "notifications_task_id_foreign" foreign key ("task_id") references "task" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "notifications" add constraint "notifications_task_bid_id_foreign" foreign key ("task_bid_id") references "task_bid" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "notifications" cascade;`);
  }

}
