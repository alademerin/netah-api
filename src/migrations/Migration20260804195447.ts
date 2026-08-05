import { Migration } from '@mikro-orm/migrations';

export class Migration20260804195447 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "task" add column "poster_rating" int null, add column "poster_review" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" drop column "poster_rating", drop column "poster_review";`);
  }

}
