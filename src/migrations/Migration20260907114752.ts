import { Migration } from '@mikro-orm/migrations';

export class Migration20260907114752 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "skills" jsonb null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" drop column "skills";');
  }

}
