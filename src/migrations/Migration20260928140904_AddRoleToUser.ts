import { Migration } from '@mikro-orm/migrations';

export class Migration20260928140904_AddRoleToUser extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "role" varchar(255) not null default 'user';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "role";`);
  }

}
