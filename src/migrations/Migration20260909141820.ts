import { Migration } from '@mikro-orm/migrations';

export class Migration20260909141820 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column if not exists "password_reset_otp" varchar(255) null, add column if not exists "password_reset_otp_expiry" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column if exists "password_reset_otp", drop column if exists "password_reset_otp_expiry";`);
  }

}
