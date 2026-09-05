import { Migration } from '@mikro-orm/migrations';

export class Migration20260905103234 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "email_notifications" boolean not null default true, add column "push_notifications" boolean not null default true, add column "sms_notifications" boolean not null default false, add column "notify_new_bids" boolean not null default true, add column "notify_task_updates" boolean not null default true, add column "notify_payment_alerts" boolean not null default true, add column "notify_weekly_digest" boolean not null default false, add column "notify_promotions" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "email_notifications", drop column "push_notifications", drop column "sms_notifications", drop column "notify_new_bids", drop column "notify_task_updates", drop column "notify_payment_alerts", drop column "notify_weekly_digest", drop column "notify_promotions";`);
  }

}
