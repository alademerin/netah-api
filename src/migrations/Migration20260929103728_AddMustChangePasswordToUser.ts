import { Migration } from '@mikro-orm/migrations';

export class Migration20260929103728_AddMustChangePasswordToUser extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "must_change_password" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "must_change_password";`);
  }

}
