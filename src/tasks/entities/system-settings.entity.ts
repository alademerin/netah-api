import { Entity, Enum, PrimaryKey, Property, Unique } from '@mikro-orm/core';

export enum ServiceChargeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Entity({ tableName: 'system_settings' })
export class SystemSettings {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  key!: string;

  @Property()
  value!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;
}
