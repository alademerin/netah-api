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
import { CounterTaskBidDto } from './dto/counter-task-bid.dto';
import { NegotiationRole, TaskBidNegotiation } from './entities/task-bid-negotiation.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { SystemSettings } from './entities/system-settings.entity';
import { NotificationType } from './entities/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskCategory)
    private readonly taskCategoryRepo: EntityRepository<TaskCategory>,

    @InjectRepository(Task)
    private readonly taskRepo: EntityRepository<Task>,

    @InjectRepository(TaskBid)
    private readonly taskBidRepo: EntityRepository<TaskBid>,

    @InjectRepository(TaskBidNegotiation)
    private readonly taskBidNegotiationRepo: EntityRepository<TaskBidNegotiation>,

    @InjectRepository(Payment)
    private readonly paymentRepo: EntityRepository<Payment>,

    @InjectRepository(SystemSettings)
    private readonly systemSettingsRepo: EntityRepository<SystemSettings>,

    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,

    private readonly notificationsService: NotificationsService,

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

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: User) {
    const task = await this.taskRepo.findOne({ publicId: id });
    if (task?.postedBy?.id !== currentUser?.id) {
      throw new UnauthorizedException();
    }
    if (!task) throw new NotFoundException('Task not found');
    this.taskRepo.assign(task, updateTaskDto);
    await this.em.flush();
    return task;
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
    const task = await this.taskRepo.findOneOrFail(
      {
        publicId: id,
        status: TaskStatusEnum.OPEN,
      },
      { populate: ['postedBy'] },
    );

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

    const bidHistory = this.taskBidNegotiationRepo.create({
      taskBid,
      amount: createTaskBidDto.amount,
      message: createTaskBidDto.message,
      createdBy: currentUser,
      role: NegotiationRole.RUNNER,
    });

    await this.em.persistAndFlush(bidHistory);

    // Notify task poster of new bid
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.NEW_BID,
      'New bid on your task',
      `${currentUser.firstName} ${currentUser.lastName} bid ${createTaskBidDto.amount} on "${task.title}"`,
      task,
      taskBid,
    );

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

    const taskBids = await this.taskBidRepo.find(
      {
        task,
      },
      { populate: ['createdBy'] },
    );

    return taskBids;
  }

  async findMyTasks(currentUser: User): Promise<MyTaskResponseDto[]> {
    const tasks = await this.taskRepo.find(
      { postedBy: currentUser },
      { populate: ['category', 'assignedTo', 'postedBy'], },
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

  async getMyBids(currentUser: User) {
    const bids = await this.taskBidRepo.find(
      { createdBy: currentUser },
      { populate: ['task', 'task.category', 'task.postedBy'] },
    );

    return bids;
  }

  async getMyAssignedTasks(currentUser: User) {
    const tasks = await this.taskRepo.find(
      { assignedTo: currentUser },
      { populate: ['category', 'postedBy', 'assignedTo'] },
    );

    return tasks;
  }

  async counterTaskBid(
    publicId: string,
    bidId: string,
    counterTaskBidDto: CounterTaskBidDto,
    currentUser: User,
  ) {
    const task = await this.taskRepo.findOne(
      {
        publicId,
      },
      { populate: ['postedBy'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const parsedBidId = Number(bidId);
    if (!Number.isInteger(parsedBidId) || parsedBidId <= 0) {
      throw new BadRequestException('Invalid bid id');
    }

    const isTaskPoster = task?.postedBy?.id === currentUser?.id;

    const taskBid = await this.taskBidRepo.findOne(
      {
        id: parsedBidId,
        task,
      },
      { populate: ['createdBy'] },
    );

    if (!taskBid) {
      throw new NotFoundException('Task bid not found');
    }

    if ([TaskBidStatus.ACCEPTED, TaskBidStatus.REJECTED].includes(taskBid.status)) {
      throw new BadRequestException('You cannot counterbid on a closed bid');
    }

    if (!isTaskPoster && taskBid.createdBy.id !== currentUser.id) {
      throw new UnauthorizedException('You are not allowed to counter this bid');
    }

    taskBid.amount = counterTaskBidDto.amount;
    taskBid.message = counterTaskBidDto.message ?? taskBid.message;
    taskBid.status = isTaskPoster ? TaskBidStatus.COUNTERED_BY_CLIENT : TaskBidStatus.COUNTERED_BY_RUNNER;

    const bidHistory = this.taskBidNegotiationRepo.create({
      taskBid,
      amount: counterTaskBidDto.amount,
      message: counterTaskBidDto.message,
      createdBy: currentUser,
      role: isTaskPoster ? NegotiationRole.CLIENT : NegotiationRole.RUNNER,
    });

    await this.em.persistAndFlush([taskBid, bidHistory]);

    // Notify the other party of counter offer
    const notificationRecipient = isTaskPoster ? taskBid.createdBy : task.postedBy;
    const notificationType = isTaskPoster
      ? NotificationType.COUNTER_OFFER_CLIENT
      : NotificationType.COUNTER_OFFER_RUNNER;

    await this.notificationsService.createNotification(
      notificationRecipient,
      notificationType,
      'Counter offer received',
      `${currentUser.firstName} ${currentUser.lastName} countered with ${counterTaskBidDto.amount} on "${task.title}"`,
      task,
      taskBid,
    );

    return taskBid;
  }

  async getTaskBidHistory(publicId: string, bidId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      publicId,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const parsedBidId = Number(bidId);
    if (!Number.isInteger(parsedBidId) || parsedBidId <= 0) {
      throw new BadRequestException('Invalid bid id');
    }

    const isTaskPoster = task?.postedBy?.id === currentUser?.id;

    const taskBid = await this.taskBidRepo.findOne(
      {
        id: parsedBidId,
        task,
      },
      { populate: ['task', 'createdBy'] },
    );

    if (!taskBid) {
      throw new NotFoundException('Task bid not found');
    }

    if (!isTaskPoster && taskBid.createdBy.id !== currentUser.id) {
      throw new UnauthorizedException('You are not allowed to view this bid history');
    }

    const bidHistory = await this.taskBidNegotiationRepo.find(
      { taskBid },
      {
        orderBy: { createdAt: 'ASC' },
        populate: ['createdBy'],
      },
    );

    return {
      bid: taskBid,
      negotiations: bidHistory.map((negotiation) => ({
        id: negotiation.id,
        amount: negotiation.amount,
        message: negotiation.message,
        role: negotiation.role,
        createdAt: negotiation.createdAt,
        createdBy: {
          id: negotiation.createdBy.id,
          firstName: negotiation.createdBy.firstName,
          lastName: negotiation.createdBy.lastName,
          email: negotiation.createdBy.email,
        },
      })),
    };
  }

  async getPaymentBreakdown(publicId: string, bidId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({ publicId });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.postedBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only task owner can view payment breakdown');
    }

    const parsedBidId = Number(bidId);
    if (!Number.isInteger(parsedBidId) || parsedBidId <= 0) {
      throw new BadRequestException('Invalid bid id');
    }

    const taskBid = await this.taskBidRepo.findOne(
      { id: parsedBidId, task },
      { populate: ['createdBy', 'task'] },
    );

    if (!taskBid) {
      throw new NotFoundException('Task bid not found');
    }

    if (taskBid.status === TaskBidStatus.ACCEPTED) {
      throw new BadRequestException('Bid already accepted');
    }

    if (taskBid.status === TaskBidStatus.REJECTED) {
      throw new BadRequestException('Cannot view breakdown for rejected bid');
    }

    // Get service charge settings
    const serviceChargePercentageSetting = await this.systemSettingsRepo.findOne({
      key: 'service_charge_percentage',
    });
    const serviceChargeFixedSetting = await this.systemSettingsRepo.findOne({
      key: 'service_charge_fixed',
    });

    // Calculate service charge (apply both and use higher value)
    let serviceCharge = 0;
    let appliedChargeType = 'none';
    const bidAmount = Number(taskBid.amount);

    const percentageCharge = serviceChargePercentageSetting
      ? bidAmount * Number(serviceChargePercentageSetting.value)
      : 0;
    const fixedCharge = serviceChargeFixedSetting
      ? Number(serviceChargeFixedSetting.value)
      : 0;

    if (percentageCharge > fixedCharge) {
      serviceCharge = percentageCharge;
      appliedChargeType = 'percentage';
    } else if (fixedCharge > 0) {
      serviceCharge = fixedCharge;
      appliedChargeType = 'fixed';
    }

    const totalAmount = bidAmount + serviceCharge;

    return {
      bid: {
        id: taskBid.id,
        amount: taskBid.amount,
        message: taskBid.message,
        status: taskBid.status,
        runner: {
          id: taskBid.createdBy.id,
          firstName: taskBid.createdBy.firstName,
          lastName: taskBid.createdBy.lastName,
        },
      },
      breakdown: {
        bidAmount,
        serviceCharge,
        serviceChargeType: appliedChargeType,
        totalAmount,
      },
    };
  }

  async acceptTaskBid(publicId: string, bidId: string, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy', 'assignedTo'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.postedBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only task owner can accept bids');
    }

    if (task.status !== TaskStatusEnum.OPEN) {
      throw new BadRequestException('Task is not open for bids');
    }

    const parsedBidId = Number(bidId);
    if (!Number.isInteger(parsedBidId) || parsedBidId <= 0) {
      throw new BadRequestException('Invalid bid id');
    }

    const taskBid = await this.taskBidRepo.findOne(
      { id: parsedBidId, task },
      { populate: ['createdBy'] },
    );

    if (!taskBid) {
      throw new NotFoundException('Task bid not found');
    }

    if (taskBid.status === TaskBidStatus.ACCEPTED) {
      throw new BadRequestException('Bid already accepted');
    }

    if (taskBid.status === TaskBidStatus.REJECTED) {
      throw new BadRequestException('Cannot accept a rejected bid');
    }

    // Get service charge settings
    const serviceChargePercentageSetting = await this.systemSettingsRepo.findOne({
      key: 'service_charge_percentage',
    });
    const serviceChargeFixedSetting = await this.systemSettingsRepo.findOne({
      key: 'service_charge_fixed',
    });

    // Calculate service charge (apply both and use higher value)
    let serviceCharge = 0;
    const bidAmount = Number(taskBid.amount);

    if (serviceChargePercentageSetting) {
      const percentage = Number(serviceChargePercentageSetting.value);
      const percentageCharge = bidAmount * percentage;
      serviceCharge = Math.max(serviceCharge, percentageCharge);
    }

    if (serviceChargeFixedSetting) {
      const fixedCharge = Number(serviceChargeFixedSetting.value);
      serviceCharge = Math.max(serviceCharge, fixedCharge);
    }

    const totalAmount = bidAmount + serviceCharge;

    // Create mock payment
    const payment = this.paymentRepo.create({
      taskBid,
      paidBy: currentUser,
      bidAmount,
      serviceCharge,
      totalAmount,
      paymentReference: `MOCK-${uuidv4()}`,
      status: PaymentStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Update bid status
    taskBid.status = TaskBidStatus.ACCEPTED;

    // Assign task to runner
    task.assignedTo = taskBid.createdBy;
    task.status = TaskStatusEnum.IN_PROGRESS;

    // Auto-reject other bids
    const otherBids = await this.taskBidRepo.find({
      task,
      id: { $ne: parsedBidId },
      status: {
        $in: [
          TaskBidStatus.PENDING,
          TaskBidStatus.COUNTERED_BY_CLIENT,
          TaskBidStatus.COUNTERED_BY_RUNNER,
        ],
      },
    });

    otherBids.forEach((bid) => {
      bid.status = TaskBidStatus.REJECTED;
      bid.deletedAt = new Date();
    });

    await this.em.persistAndFlush([payment, taskBid, task, ...otherBids]);

    // Notify runner of task assignment
    await this.notificationsService.createNotification(
      taskBid.createdBy,
      NotificationType.TASK_ASSIGNED,
      'Your bid was accepted!',
      `Your bid of ${bidAmount} on "${task.title}" was accepted. Task is now in progress.`,
      task,
      taskBid,
    );

    return {
      task,
      bid: taskBid,
      payment: {
        id: payment.id,
        bidAmount: payment.bidAmount,
        serviceCharge: payment.serviceCharge,
        totalAmount: payment.totalAmount,
        paymentReference: payment.paymentReference,
        status: payment.status,
      },
    };
  }

  async rejectTaskBid(publicId: string, bidId: string, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.postedBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only task owner can reject bids');
    }

    const parsedBidId = Number(bidId);
    if (!Number.isInteger(parsedBidId) || parsedBidId <= 0) {
      throw new BadRequestException('Invalid bid id');
    }

    const taskBid = await this.taskBidRepo.findOne(
      {
        id: parsedBidId,
        task,
      },
      { populate: ['createdBy'] },
    );

    if (!taskBid) {
      throw new NotFoundException('Task bid not found');
    }

    if (taskBid.status === TaskBidStatus.ACCEPTED) {
      throw new BadRequestException('Cannot reject an accepted bid');
    }

    if (taskBid.status === TaskBidStatus.REJECTED) {
      throw new BadRequestException('Bid already rejected');
    }

    // Soft delete the bid
    taskBid.status = TaskBidStatus.REJECTED;
    taskBid.deletedAt = new Date();

    await this.em.flush();

    // Notify runner of bid rejection
    await this.notificationsService.createNotification(
      taskBid.createdBy,
      NotificationType.BID_REJECTED,
      'Your bid was rejected',
      `Your bid on "${task.title}" was rejected. You can submit a new bid if you wish.`,
      task,
      taskBid,
    );

    return { message: 'Bid rejected successfully. Runner can bid again if desired.' };
  }
}
