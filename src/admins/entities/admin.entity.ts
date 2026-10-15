import { Entity, Property, PrimaryKey, Unique, BeforeCreate, BeforeUpdate, EventArgs } from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Entity()
export class Admin {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  email!: string;

  @Property()
  @Exclude()
  password!: string;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  @Unique()
  phoneNumber!: string;

  @Property({ default: true })
  mustChangePassword?: boolean = true;

  @Property({ nullable: true })
  @Exclude()
  twoFactorSecret?: string;

  @Property({ default: false })
  twoFactorEnabled?: boolean = false;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt?: Date;

  @BeforeCreate()
  async hashPasswordOnCreate() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate(args: EventArgs<Admin>) {
    const payload = args.changeSet?.payload;
    if (payload && 'password' in payload && this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
