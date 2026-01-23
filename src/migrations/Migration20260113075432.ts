import { Migration } from '@mikro-orm/migrations';

export class Migration20260113075432 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "task" ("id" serial primary key, "description" varchar(255) not null);`);

    this.addSql(`create table "task_category" ("id" serial primary key, "name" varchar(255) not null, "description" varchar(255) not null);`);
    this.addSql(`alter table "task_category" add constraint "task_category_name_unique" unique ("name");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "task" cascade;`);

    this.addSql(`drop table if exists "task_category" cascade;`);
  }

}
