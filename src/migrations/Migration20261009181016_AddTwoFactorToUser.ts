import { Migration } from '@mikro-orm/migrations';

export class Migration20261009181016_AddTwoFactorToUser extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "two_factor_secret" varchar(255) null, add column "two_factor_enabled" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "two_factor_secret", drop column "two_factor_enabled";`);
  }

}
