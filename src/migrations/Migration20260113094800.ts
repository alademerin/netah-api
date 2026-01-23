import { Migration } from '@mikro-orm/migrations';

export class Migration20260113094800 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task_category" add column "created_at" timestamptz not null, add column "deleted_at" timestamptz null;`);

    this.addSql(`alter table "task" add column "title" varchar(255) not null, add column "location" varchar(255) not null, add column "urgency" text check ("urgency" in ('ASAP', 'FLEXIBLE', 'TODAY')) not null, add column "requirements" jsonb null, add column "photos" jsonb not null default '[]', add column "category_id" int not null;`);
    this.addSql(`alter table "task" add constraint "task_category_id_foreign" foreign key ("category_id") references "task_category" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop constraint "task_category_id_foreign";`);

    this.addSql(`alter table "task" drop column "title", drop column "location", drop column "urgency", drop column "requirements", drop column "photos", drop column "category_id";`);

    this.addSql(`alter table "task_category" drop column "created_at", drop column "deleted_at";`);
  }

}
