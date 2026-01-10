import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('user already exists');
    }
    const user = this.userRepo.create(createUserDto);
    await this.em.persistAndFlush(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepo.findAll();
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.userRepo.findOne({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ email });
    // if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ phoneNumber });
    // if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ id });
    if (!user) throw new NotFoundException('User not found');
    this.userRepo.assign(user, updateUserDto);
    await this.em.flush();
    return user;
  }

  async remove(id: number) {
    const user = await this.userRepo.findOneOrFail({ id });
    if (!user) throw new NotFoundException('User not found');
    user.deletedAt = new Date();
    await this.em.flush();
  }
}
