import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true, // 👈 automatically applied to all queries
})
export class TaskCategory {
  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  name: string;

  @Property()
  description: string;

  @Property({ onCreate: () => new Date() })
  createdAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}
