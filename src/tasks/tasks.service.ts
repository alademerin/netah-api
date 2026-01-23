import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTaskDto,
  TaskStatusEnum,
  TaskUrgencyEnum,
} from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCategoryDto } from './dto/create-task-category.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { TaskCategory } from './entities/task-category.entity';
import { Task } from './entities/task.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateTaskBidDto, TaskBidStatus } from './dto/create-task-bid.dto';
import { TaskBid } from './entities/task-bid.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskCategory)
    private readonly taskCategoryRepo: EntityRepository<TaskCategory>,

    @InjectRepository(Task)
    private readonly taskRepo: EntityRepository<Task>,

    @InjectRepository(TaskBid)
    private readonly taskBidRepo: EntityRepository<TaskBid>,

    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,

    private readonly em: EntityManager,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User) {
    const category = await this.taskCategoryRepo.findOne(
      createTaskDto?.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Task category not found');
    }

    const user = await this.userRepo.findOne(currentUser.id);

    if (!user) {
      throw new NotFoundException('Task category not found');
    }

    const task = this.taskRepo.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      location: createTaskDto.location,
      reward: createTaskDto.reward,
      urgency: createTaskDto.urgency ?? TaskUrgencyEnum.FLEXIBLE,
      requirements: createTaskDto.requirements,
      status: TaskStatusEnum.OPEN,
      category,
      postedBy: user, // 👈 creator
    });

    await this.em.persistAndFlush(task);
    return task;
  }

  async findAll() {
    return await this.taskRepo.findAll({
      populate: ['category', 'postedBy', 'assignedTo'],
    });
  }

  async findOne(id: number, currentUser) {
    const task = await this.taskRepo.findOne({ id });
    return task;
  }

  async findOneByUuid(publicId: string, currentUser) {
    const task = await this.taskRepo.findOne(
      { publicId },
      {
        populate: ['category', 'postedBy', 'assignedTo'],
      },
    );
    return task;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }

  async createCategory(createTaskCategoryDto: CreateTaskCategoryDto) {
    const normalizedName = createTaskCategoryDto.name.trim().toLowerCase();

    const existingCategory = await this.taskCategoryRepo.findOne({
      name: normalizedName,
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name ${normalizedName} already exists`,
      );
    }
    const taskCategory = this.taskCategoryRepo.create({
      ...createTaskCategoryDto,
      name: normalizedName,
    });
    await this.em.persistAndFlush(taskCategory);
    return taskCategory;
  }

  async findAllCategories() {
    const taskCategories = await this.taskCategoryRepo.findAll();
    return taskCategories;
  }

  async removeCategory(id: number) {
    const category = await this.taskCategoryRepo.findOneOrFail({ id });
    if (!category) throw new NotFoundException('Category not found');
    category.deletedAt = new Date();
    await this.em.flush();
  }

  async createBid(
    id: string,
    createTaskBidDto: CreateTaskBidDto,
    currentUser: User,
  ) {
    const task = await this.taskRepo.findOneOrFail({
      publicId: id,
      status: TaskStatusEnum.OPEN,
    });

    if (task?.postedBy?.id === currentUser?.id) {
      throw new BadRequestException('You cannot bid on your own task');
    }

    const existingBid = await this.taskBidRepo.findOne({
      task,
      createdBy: currentUser?.id,
      status: TaskBidStatus.PENDING,
    });

    if (existingBid) {
      throw new BadRequestException(
        'You already have an active bid on this task',
      );
    }

    const taskBid = this.taskBidRepo.create({
      task,
      createdBy: currentUser.id,
      amount: createTaskBidDto.amount,
      message: createTaskBidDto.message,
      status: TaskBidStatus.PENDING,
    });

    await this.em.persistAndFlush(taskBid);
    return taskBid;
  }
}
