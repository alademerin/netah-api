import { Migration } from '@mikro-orm/migrations';

export class Migration20260909171747 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" add column "deadline" timestamptz null;`);
    this.addSql(`update "task" set "deadline" = now() + interval '7 days' where "deadline" is null;`);
    this.addSql(`alter table "task" alter column "deadline" set not null;`);

    this.addSql(`alter table "task" drop column "urgency";`);
    this.addSql(`alter table "task" rename column "photos" to "images";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop column "deadline";`);

    this.addSql(`alter table "task" add column "urgency" text check ("urgency" in ('ASAP', 'FLEXIBLE', 'TODAY')) not null;`);
    this.addSql(`alter table "task" rename column "images" to "photos";`);
  }

}
