import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto, TaskStatusEnum, TaskUrgencyEnum } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCategoryDto } from './dto/create-task-category.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { TaskCategory } from './entities/task-category.entity';
import { Task } from './entities/task.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateTaskBidDto, TaskBidStatus } from './dto/create-task-bid.dto';
import { TaskBid } from './entities/task-bid.entity';
import { NotFoundError } from 'rxjs';
import { MyTaskResponseDto } from './dto/my-task.response.dto';

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
    const category = await this.taskCategoryRepo.findOne({
      id: createTaskDto?.categoryId,
    });

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

  async findOne(id: number) {
    const task = await this.taskRepo.findOne({ id });
    return task;
  }

  async findOneByUuid(publicId: string) {
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
      throw new ConflictException(`Category with name ${normalizedName} already exists`);
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

  async createBid(id: string, createTaskBidDto: CreateTaskBidDto, currentUser: User) {
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
      throw new BadRequestException('You already have an active bid on this task');
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

  async getUserBid(publicId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      publicId,
    });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task?.postedBy === currentUser) {
      throw new BadRequestException('You cannot bid on your own tasks');
    }

    const taskBid = await this.taskBidRepo.findOne({
      task,
      createdBy: currentUser?.id,
    });

    if (!taskBid) {
      throw new NotFoundError('Task Bid not found');
    }

    return taskBid;
  }

  async getTaskBids(publicId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      publicId,
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task?.postedBy?.id !== currentUser?.id)
      throw new UnauthorizedException('You cannot view other bids');

    const taskBids = await this.taskBidRepo.find({
      task,
      
    },{populate:['createdBy']});

    return taskBids;
  }

  async findMyTasks(currentUser: User): Promise<MyTaskResponseDto[]> {
    const tasks = await this.taskRepo.find(
      { postedBy: currentUser },
      { populate: ['category', 'assignedTo', 'postedBy'] },
    );

    const tasksWithBidCount: MyTaskResponseDto[] = await Promise.all(
      tasks.map(async (task) => {
        const bidCount = await this.taskBidRepo.count({ task });

        return {
          id: task.id,
          publicId: task.publicId,
          title: task.title,
          description: task.description,
          location: task.location,
          reward: task.reward,
          urgency: task.urgency,
          status: task.status,
          createdAt: task.createdAt,
          bidCount,
        };
      }),
    );

    return tasksWithBidCount;
  }
}
