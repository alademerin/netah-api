import { Migration } from '@mikro-orm/migrations';

export class Migration20260905112125 extends Migration {

  override async up(): Promise<void> {
    // Add uuid column as nullable first
    this.addSql(`alter table "user" add column "uuid" varchar(255) null;`);

    // Generate UUIDs for existing users using gen_random_uuid() PostgreSQL function
    this.addSql(`update "user" set "uuid" = gen_random_uuid()::text where "uuid" is null;`);

    // Make uuid not null and add unique constraint
    this.addSql(`alter table "user" alter column "uuid" set not null;`);
    this.addSql(`alter table "user" add constraint "user_uuid_unique" unique ("uuid");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_uuid_unique";`);
    this.addSql(`alter table "user" drop column "uuid";`);
  }

}
