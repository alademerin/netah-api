import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  Filter,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true, // 👈 automatically applied to all queries
})
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, defaultRaw: 'uuid_generate_v4()' })
  uuid?: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  phoneNumber!: string;

  @Property({ nullable: true })
  address?: string;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true, type: 'text' })
  bio?: string;

  @Property()
  @Exclude()
  password!: string;

  @Property()
  registeredAs?: string;

  // Notification Channels
  @Property({ default: true })
  emailNotifications?: boolean = true;

  @Property({ default: true })
  pushNotifications?: boolean = true;

  @Property({ default: false })
  smsNotifications?: boolean = false;

  // Notification Preferences
  @Property({ default: true })
  notifyNewBids?: boolean = true;

  @Property({ default: true })
  notifyTaskUpdates?: boolean = true;

  @Property({ default: true })
  notifyPaymentAlerts?: boolean = true;

  @Property({ default: false })
  notifyWeeklyDigest?: boolean = false;

  @Property({ default: true })
  notifyPromotions?: boolean = true;

  // Profile Visibility Settings
  @Property({ default: true })
  showLocation?: boolean = true;

  @Property({ default: true })
  showRating?: boolean = true;

  @Property({ default: true })
  showCompletedTasksCount?: boolean = true;

  @Property({ default: true })
  allowDirectMessages?: boolean = true;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  @BeforeCreate()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = uuidv4();
    }
  }

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
