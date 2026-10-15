import { Migration } from '@mikro-orm/migrations';

export class Migration20261012200512 extends Migration {

  override async up(): Promise<void> {
    // Check if admin table exists and alter if needed
    this.addSql(`
      DO $$
      BEGIN
        -- If table doesn't exist, create it
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin') THEN
          CREATE TABLE "admin" (
            "id" serial primary key,
            "email" varchar(255) not null,
            "password" varchar(255) not null,
            "first_name" varchar(255) not null,
            "last_name" varchar(255) not null,
            "phone_number" varchar(255) not null,
            "must_change_password" boolean not null default true,
            "two_factor_secret" varchar(255) null,
            "two_factor_enabled" boolean not null default false,
            "created_at" timestamptz null,
            "updated_at" timestamptz null
          );
          ALTER TABLE "admin" ADD CONSTRAINT "admin_email_unique" UNIQUE ("email");
          ALTER TABLE "admin" ADD CONSTRAINT "admin_phone_number_unique" UNIQUE ("phone_number");
        -- If table exists with UUID id, convert to serial
        ELSIF EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'admin'
          AND column_name = 'id'
          AND data_type = 'uuid'
        ) THEN
          -- Drop and recreate with new ID mapping
          ALTER TABLE "admin" DROP CONSTRAINT IF EXISTS "admin_pkey";
          ALTER TABLE "admin" ADD COLUMN "id_new" serial;
          UPDATE "admin" SET "id_new" = nextval('admin_id_new_seq');
          ALTER TABLE "admin" DROP COLUMN "id";
          ALTER TABLE "admin" RENAME COLUMN "id_new" TO "id";
          ALTER TABLE "admin" ADD PRIMARY KEY ("id");
        END IF;
      END $$;
    `);

    // Copy existing admins from user table to admin table if not already there
    this.addSql(`
      INSERT INTO "admin" (
        "email",
        "password",
        "first_name",
        "last_name",
        "phone_number",
        "must_change_password",
        "two_factor_secret",
        "two_factor_enabled",
        "created_at",
        "updated_at"
      )
      SELECT
        u."email",
        u."password",
        u."first_name",
        u."last_name",
        u."phone_number",
        COALESCE(u."must_change_password", false),
        u."two_factor_secret",
        COALESCE(u."two_factor_enabled", false),
        COALESCE(u."created_at", NOW()),
        NOW()
      FROM "user" u
      WHERE u."role" = 'admin'
      AND NOT EXISTS (SELECT 1 FROM "admin" a WHERE a."email" = u."email");
    `);

    // Delete admin users from user table
    this.addSql(`DELETE FROM "user" WHERE "role" = 'admin';`);

    // Drop admin-specific columns from user table
    this.addSql(`alter table "user" drop column if exists "role", drop column if exists "must_change_password", drop column if exists "two_factor_secret", drop column if exists "two_factor_enabled";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "admin" cascade;`);

    this.addSql(`alter table "user" add column "role" varchar(255) not null default 'user', add column "must_change_password" boolean not null default false, add column "two_factor_secret" varchar(255) null, add column "two_factor_enabled" boolean not null default false;`);
  }

}
