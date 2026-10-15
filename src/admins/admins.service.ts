import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: EntityRepository<Admin>,
    private readonly em: EntityManager,
  ) {}

  async create(createAdminDto: CreateAdminDto | Partial<Admin>): Promise<Admin> {
    const admin = this.em.create(Admin, createAdminDto as any);
    await this.em.persistAndFlush(admin);
    return admin;
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ id });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async findOneByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ email });
  }

  async findOneByEmailWithPassword(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ email }, { populate: ['password'] });
  }

  async findOneByPhoneNumber(phoneNumber: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ phoneNumber });
  }

  async update(id: number, updateData: Partial<Admin>): Promise<Admin> {
    const admin = await this.findOne(id);

    // If password is being updated, hash it
    if (updateData.password) {
      admin.password = updateData.password;
    }

    Object.assign(admin, updateData);
    await this.em.flush();
    return admin;
  }

  async findAll(): Promise<Admin[]> {
    return this.adminRepository.findAll();
  }

  async remove(id: number): Promise<void> {
    const admin = await this.findOne(id);
    await this.em.removeAndFlush(admin);
  }
}
