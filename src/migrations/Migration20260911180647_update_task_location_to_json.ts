import { Migration } from '@mikro-orm/migrations';

export class Migration20260911180647_update_task_location_to_json extends Migration {

  override async up(): Promise<void> {
    // Convert existing string locations to JSON format with landmark field
    this.addSql(`
      alter table "task"
      alter column "location" type jsonb
      using (
        case
          when "location" ~ '^[{[]' then "location"::jsonb
          else json_build_object('landmark', "location", 'latitude', 0, 'longitude', 0)::jsonb
        end
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "task" alter column "location" type varchar(255) using ("location"::varchar(255));`);
  }

}
