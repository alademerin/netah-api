import { Migration } from '@mikro-orm/migrations';

export class Migration20260909155838 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "profile_image" varchar(255) null, add column "profile_image_public_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "profile_image", drop column "profile_image_public_id";`);
  }

}
