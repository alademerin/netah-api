import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Task {
  @PrimaryKey()
  id: number;

  @Property()
  description: string;
}
