import { Migration } from '@mikro-orm/migrations';

export class Migration20260109215513 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "first_name" varchar(255) not null, add column "last_name" varchar(255) not null, add column "phone_number" varchar(255) not null, add column "password" varchar(255) not null, add column "registered_as" varchar(255) not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "first_name", drop column "last_name", drop column "phone_number", drop column "password", drop column "registered_as";`);
  }

}
