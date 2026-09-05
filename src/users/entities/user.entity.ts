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

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true, // 👈 automatically applied to all queries
})
export class User {
  @PrimaryKey()
  id!: number;

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

  @Property({ nullable: true, type: 'text' })
  bio?: string;

  @Property()
  @Exclude()
  password!: string;

  @Property()
  registeredAs?: string;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
