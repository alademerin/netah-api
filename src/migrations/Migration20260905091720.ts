import { Migration } from '@mikro-orm/migrations';

export class Migration20260905091720 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "address" varchar(255) null, add column "bio" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "address", drop column "bio";`);
  }

}
