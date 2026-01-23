import { Migration } from '@mikro-orm/migrations';

export class Migration20260116162619 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" add column "public_id" uuid not null;`);
    this.addSql(`create index "task_public_id_index" on "task" ("public_id");`);
    this.addSql(`alter table "task" add constraint "task_public_id_unique" unique ("public_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "task_public_id_index";`);
    this.addSql(`alter table "task" drop constraint "task_public_id_unique";`);
    this.addSql(`alter table "task" drop column "public_id";`);
  }

}
