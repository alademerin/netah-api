import { Migration } from '@mikro-orm/migrations';

export class Migration20260905110410 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "city" varchar(255) null, add column "show_location" boolean not null default true, add column "show_rating" boolean not null default true, add column "show_completed_tasks_count" boolean not null default true, add column "allow_direct_messages" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "city", drop column "show_location", drop column "show_rating", drop column "show_completed_tasks_count", drop column "allow_direct_messages";`);
  }

}
