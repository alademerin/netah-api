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
import { ApproveTaskDto } from './dto/approve-task.dto';
import { DisputeTaskDto } from './dto/dispute-task.dto';
import { ReviewPosterDto } from './dto/review-poster.dto';
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

  // Helper method to serialize user for public consumption
  private async serializePublicUser(user: User | null | undefined): Promise<any> {
    if (!user) return null;

    // Extract values before building object to ensure no entity references
    const uuid = user.uuid || `user-${user.id}`; // Fallback if uuid is missing
    const firstName = user.firstName;
    const lastName = user.lastName;
    const registeredAs = user.registeredAs;
    const showRating = user.showRating ?? false;
    const showLocation = user.showLocation ?? false;
    const showCompletedTasksCount = user.showCompletedTasksCount ?? false;

    // Create plain object with only public fields
    const publicUser: any = {
      uuid,
      firstName,
      lastName,
      registeredAs,
      createdAt: user.createdAt,
      skills: user.skills || [],
      profileImage: user.profileImage,
    };

    // Get tasks posted count (always show for transparency)
    const tasksPostedCount = await this.taskRepo.count({
      postedBy: user,
    });
    publicUser.tasksPosted = tasksPostedCount;

    // Only include profile visibility fields if they're explicitly allowed
    if (showRating) {
      // Get reviews for rating calculation
      const runnerReviews = await this.taskRepo.find({
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
        rating: { $ne: null },
      });

      const posterReviews = await this.taskRepo.find({
        postedBy: user,
        status: TaskStatusEnum.COMPLETED,
        posterRating: { $ne: null },
      });

      const allRatings = [
        ...runnerReviews.map((t) => t.rating!),
        ...posterReviews.map((t) => t.posterRating!),
      ];

      const avgRating =
        allRatings.length > 0
          ? parseFloat((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
          : 0;

      publicUser.rating = avgRating;
      publicUser.totalReviews = allRatings.length;
    }
    if (showLocation && user.city) {
      publicUser.city = user.city;
    }
    if (showCompletedTasksCount) {
      const completedTasks = await this.taskRepo.count({
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
      });
      publicUser.completedTasksCount = completedTasks;
    }

    return publicUser;
  }

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

  async findAll(currentUser?: User) {
    const filter: any = {
      status: TaskStatusEnum.OPEN,
    };

    // If user is logged in, exclude their own tasks
    if (currentUser) {
      filter.postedBy = { $ne: currentUser.id };
    }

    const tasks = await this.taskRepo.find(filter, {
      populate: ['category', 'postedBy'],
    });

    return Promise.all(tasks.map(async task => ({
      id: task.id,
      publicId: task.publicId,
      title: task.title,
      description: task.description,
      location: task.location,
      reward: task.reward,
      urgency: task.urgency,
      requirements: task.requirements,
      status: task.status,
      createdAt: task.createdAt,
      category: {
        id: task.category.id,
        name: task.category.name,
        description: task.category.description,
      },
      postedBy: await this.serializePublicUser(task.postedBy),
    })));
  }

  async findOne(id: number) {
    const task = await this.taskRepo.findOne({ id });
    return task;
  }

  async findOneByUuid(publicId: string, currentUser?: User): Promise<any> {
    const task = await this.taskRepo.findOne(
      { publicId },
      {
        populate: ['category', 'postedBy', 'assignedTo'],
      },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Build explicit response without spreading task to avoid leaking populated relations
    const response = {
      id: task.id,
      publicId: task.publicId,
      title: task.title,
      description: task.description,
      location: task.location,
      reward: task.reward,
      urgency: task.urgency,
      requirements: task.requirements,
      status: task.status,
      rating: task.rating,
      feedback: task.feedback,
      posterRating: task.posterRating,
      posterReview: task.posterReview,
      disputeReason: task.disputeReason,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      category: {
        id: task.category.id,
        name: task.category.name,
        description: task.category.description,
      },
      postedBy: await this.serializePublicUser(task.postedBy),
      assignedTo: await this.serializePublicUser(task.assignedTo),
    };

    if (currentUser) {
      const isRunner = task.assignedTo?.id === currentUser.id;
      const isPoster = task.postedBy.id === currentUser.id;

      response['hasReviewed'] = isRunner ? !!task.posterRating : isPoster ? !!task.rating : false;
    }

    return response;
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
      status: {
        $in: [
          TaskBidStatus.PENDING,
          TaskBidStatus.COUNTERED_BY_CLIENT,
          TaskBidStatus.COUNTERED_BY_RUNNER,
        ],
      },
    });

    if (existingBid) {
      throw new BadRequestException('You already have an active bid on this task');
    }

    // Get full user object with names
    const bidder = await this.userRepo.findOne({ id: currentUser.id });
    if (!bidder) {
      throw new NotFoundException('User not found');
    }

    const taskBid = this.taskBidRepo.create({
      task,
      createdBy: bidder,
      amount: createTaskBidDto.amount,
      message: createTaskBidDto.message,
      status: TaskBidStatus.PENDING,
    });

    await this.em.persistAndFlush(taskBid);

    const bidHistory = this.taskBidNegotiationRepo.create({
      taskBid,
      amount: createTaskBidDto.amount,
      message: createTaskBidDto.message,
      createdBy: bidder,
      role: NegotiationRole.RUNNER,
    });

    await this.em.persistAndFlush(bidHistory);

    // Notify task poster of new bid
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.NEW_BID,
      'New bid on your task',
      `${bidder.firstName} ${bidder.lastName} bid ${createTaskBidDto.amount} on "${task.title}"`,
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

    return Promise.all(taskBids.map(async bid => ({
      id: bid.id,
      amount: bid.amount,
      message: bid.message,
      status: bid.status,
      createdAt: bid.createdAt,
      createdBy: await this.serializePublicUser(bid.createdBy),
    })));
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
          publicId: task.publicId!,
          title: task.title,
          description: task.description,
          location: task.location,
          reward: task.reward,
          urgency: task.urgency,
          status: task.status,
          createdAt: task.createdAt,
          bidCount,
          hasReviewed: !!task.rating,
        };
      }),
    );

    return tasksWithBidCount;
  }

  async getMyBids(currentUser: User) {
    const bids = await this.taskBidRepo.find(
      {
        createdBy: currentUser,
        status: {
          $in: [
            TaskBidStatus.PENDING,
            TaskBidStatus.COUNTERED_BY_CLIENT,
            TaskBidStatus.COUNTERED_BY_RUNNER,
          ],
        },
      },
      { populate: ['task', 'task.category', 'task.postedBy'] },
    );

    return Promise.all(bids.map(async bid => ({
      id: bid.id,
      amount: bid.amount,
      message: bid.message,
      status: bid.status,
      createdAt: bid.createdAt,
      task: {
        id: bid.task.id,
        publicId: bid.task.publicId,
        title: bid.task.title,
        description: bid.task.description,
        location: bid.task.location,
        reward: bid.task.reward,
        urgency: bid.task.urgency,
        status: bid.task.status,
        createdAt: bid.task.createdAt,
        category: {
          id: bid.task.category.id,
          name: bid.task.category.name,
          description: bid.task.category.description,
        },
        postedBy: await this.serializePublicUser(bid.task.postedBy),
      }
    })));
  }

  async getMyAssignedTasks(currentUser: User): Promise<any[]> {
    const tasks = await this.taskRepo.find(
      { assignedTo: currentUser },
      { populate: ['category', 'postedBy', 'assignedTo'] },
    );

    return Promise.all(tasks.map(async (task) => ({
      id: task.id,
      publicId: task.publicId,
      title: task.title,
      description: task.description,
      location: task.location,
      reward: task.reward,
      urgency: task.urgency,
      requirements: task.requirements,
      status: task.status,
      rating: task.rating,
      feedback: task.feedback,
      posterRating: task.posterRating,
      posterReview: task.posterReview,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      category: {
        id: task.category.id,
        name: task.category.name,
        description: task.category.description,
      },
      postedBy: await this.serializePublicUser(task.postedBy),
      assignedTo: await this.serializePublicUser(task.assignedTo),
      hasReviewed: !!task.posterRating,
    })));
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

    // Get full user object with names
    const counteringUser = await this.userRepo.findOne({ id: currentUser.id });
    if (!counteringUser) {
      throw new NotFoundException('User not found');
    }

    taskBid.amount = counterTaskBidDto.amount;
    taskBid.message = counterTaskBidDto.message ?? taskBid.message;
    taskBid.status = isTaskPoster ? TaskBidStatus.COUNTERED_BY_CLIENT : TaskBidStatus.COUNTERED_BY_RUNNER;

    const bidHistory = this.taskBidNegotiationRepo.create({
      taskBid,
      amount: counterTaskBidDto.amount,
      message: counterTaskBidDto.message,
      createdBy: counteringUser,
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
      `${counteringUser.firstName} ${counteringUser.lastName} countered with ${counterTaskBidDto.amount} on "${task.title}"`,
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
          uuid: negotiation.createdBy.uuid,
          firstName: negotiation.createdBy.firstName,
          lastName: negotiation.createdBy.lastName,
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

    // Notify client of successful task assignment
    await this.notificationsService.createNotification(
      currentUser,
      NotificationType.BID_ACCEPTED,
      'Task assigned successfully!',
      `You accepted ${taskBid.createdBy.firstName} ${taskBid.createdBy.lastName}'s bid of ${bidAmount} on "${task.title}". Task is now in progress.`,
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

  async withdrawBid(publicId: string, bidId: string, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
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

    if (taskBid.createdBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only the bid creator can withdraw this bid');
    }

    if (taskBid.status === TaskBidStatus.ACCEPTED) {
      throw new BadRequestException('Cannot withdraw an accepted bid');
    }

    if (taskBid.status === TaskBidStatus.REJECTED) {
      throw new BadRequestException('Bid already rejected/withdrawn');
    }

    // Soft delete the bid
    taskBid.status = TaskBidStatus.REJECTED;
    taskBid.deletedAt = new Date();

    await this.em.flush();

    // Notify poster of withdrawal
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.BID_REJECTED,
      'Bid withdrawn',
      `${taskBid.createdBy.firstName} ${taskBid.createdBy.lastName} withdrew their bid of ${taskBid.amount} on "${task.title}".`,
      task,
      taskBid,
    );

    return { message: 'Bid withdrawn successfully' };
  }

  async getCompletionDetails(publicId: string, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy', 'assignedTo', 'category'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.postedBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only task poster can view completion details');
    }

    if (task.status !== TaskStatusEnum.PENDING_APPROVAL) {
      throw new BadRequestException('Task must be pending approval');
    }

    if (!task.assignedTo) {
      throw new BadRequestException('No runner assigned to this task');
    }

    // Get the accepted bid to find payment details
    const acceptedBid = await this.taskBidRepo.findOne({
      task,
      status: TaskBidStatus.ACCEPTED,
    });

    if (!acceptedBid) {
      throw new NotFoundException('Accepted bid not found');
    }

    // Get payment record
    const payment = await this.paymentRepo.findOne({
      taskBid: acceptedBid,
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const amountToDisburse = Number(payment.bidAmount);

    return {
      task: {
        id: task.id,
        publicId: task.publicId,
        title: task.title,
        description: task.description,
        status: task.status,
        category: task.category.name,
        hasReviewed: !!task.rating,
      },
      runner: {
        id: task.assignedTo.id,
        firstName: task.assignedTo.firstName,
        lastName: task.assignedTo.lastName,
        email: task.assignedTo.email,
      },
      amountToDisburse,
    };
  }

  async markTaskAsCompleted(publicId: string, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['assignedTo', 'postedBy'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.assignedTo || task.assignedTo.id !== currentUser.id) {
      throw new UnauthorizedException('Only the assigned runner can mark task as completed');
    }

    if (task.status !== TaskStatusEnum.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress tasks can be marked as completed');
    }

    task.status = TaskStatusEnum.PENDING_APPROVAL;

    await this.em.flush();

    // Notify poster that task is ready for approval
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.TASK_STATUS_CHANGED,
      'Task completed - awaiting approval',
      `${task.assignedTo.firstName} ${task.assignedTo.lastName} marked "${task.title}" as completed. Please review and approve.`,
      task,
    );

    // Notify runner (confirmation)
    await this.notificationsService.createNotification(
      task.assignedTo,
      NotificationType.TASK_STATUS_CHANGED,
      'Task marked as completed',
      `You marked "${task.title}" as completed. Waiting for client approval.`,
      task,
    );

    return task;
  }

  async approveAndReleaseFunds(publicId: string, approveTaskDto: ApproveTaskDto, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy', 'assignedTo'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.postedBy.id !== currentUser.id) {
      throw new UnauthorizedException('Only task poster can approve and release funds');
    }

    if (task.status !== TaskStatusEnum.PENDING_APPROVAL) {
      throw new BadRequestException('Task must be pending approval');
    }

    if (!task.assignedTo) {
      throw new BadRequestException('No runner assigned to this task');
    }

    // Store rating and feedback
    task.rating = approveTaskDto.rating;
    task.feedback = approveTaskDto.feedback;
    task.status = TaskStatusEnum.COMPLETED;
    task.completedAt = new Date();

    await this.em.flush();

    // Notify runner that task is approved and funds released
    const feedbackText = approveTaskDto.feedback
      ? ` Feedback: "${approveTaskDto.feedback}"`
      : '';
    await this.notificationsService.createNotification(
      task.assignedTo,
      NotificationType.TASK_STATUS_CHANGED,
      'Task approved - funds released!',
      `Your completed task "${task.title}" has been approved with ${approveTaskDto.rating} stars.${feedbackText} Funds have been released.`,
      task,
    );

    // Notify poster (confirmation)
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.TASK_STATUS_CHANGED,
      'Task completed successfully',
      `You approved "${task.title}" with ${approveTaskDto.rating} stars. Funds released to ${task.assignedTo.firstName} ${task.assignedTo.lastName}.`,
      task,
    );

    return {
      task,
      message: 'Task approved and funds released successfully',
    };
  }

  async disputeTask(publicId: string, disputeTaskDto: DisputeTaskDto, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy', 'assignedTo'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.assignedTo) {
      throw new BadRequestException('No runner assigned to this task');
    }

    const isPoster = task.postedBy.id === currentUser.id;
    const isRunner = task.assignedTo.id === currentUser.id;

    if (!isPoster && !isRunner) {
      throw new UnauthorizedException('Only task poster or runner can dispute a task');
    }

    // Poster can only dispute during PENDING_APPROVAL
    if (isPoster && task.status !== TaskStatusEnum.PENDING_APPROVAL) {
      throw new BadRequestException('Poster can only dispute pending approval tasks');
    }

    // Runner can dispute during IN_PROGRESS or PENDING_APPROVAL
    if (isRunner && ![TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.PENDING_APPROVAL].includes(task.status)) {
      throw new BadRequestException('Runner can only dispute in-progress or pending approval tasks');
    }

    task.status = TaskStatusEnum.DISPUTED;
    task.disputeReason = disputeTaskDto.reason;

    await this.em.flush();

    // Notify the other party
    const otherParty = isPoster ? task.assignedTo : task.postedBy;
    const disputingPartyName = isPoster
      ? 'Task poster'
      : `${currentUser.firstName} ${currentUser.lastName}`;

    await this.notificationsService.createNotification(
      otherParty,
      NotificationType.TASK_STATUS_CHANGED,
      'Task disputed',
      `${disputingPartyName} disputed "${task.title}". Reason: ${disputeTaskDto.reason}`,
      task,
    );

    // Notify disputing party (confirmation)
    await this.notificationsService.createNotification(
      currentUser,
      NotificationType.TASK_STATUS_CHANGED,
      'Dispute submitted',
      `You disputed "${task.title}". Our support team will review this case and contact both parties.`,
      task,
    );

    return {
      task,
      message: 'Dispute submitted successfully. Our support team will review this case.',
    };
  }

  async reviewPoster(publicId: string, reviewPosterDto: ReviewPosterDto, currentUser: User) {
    const task = await this.taskRepo.findOne(
      { publicId },
      { populate: ['postedBy', 'assignedTo'] },
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.assignedTo || task.assignedTo.id !== currentUser.id) {
      throw new UnauthorizedException('Only the assigned runner can review the poster');
    }

    if (task.status !== TaskStatusEnum.COMPLETED) {
      throw new BadRequestException('Only completed tasks can be reviewed');
    }

    if (task.posterRating) {
      throw new BadRequestException('You have already reviewed this poster');
    }

    task.posterRating = reviewPosterDto.rating;
    task.posterReview = reviewPosterDto.review;

    await this.em.flush();

    // Notify poster of review
    const reviewText = reviewPosterDto.review ? ` Review: "${reviewPosterDto.review}"` : '';
    await this.notificationsService.createNotification(
      task.postedBy,
      NotificationType.TASK_STATUS_CHANGED,
      'You received a review!',
      `${task.assignedTo.firstName} ${task.assignedTo.lastName} rated you ${reviewPosterDto.rating} stars for "${task.title}".${reviewText}`,
      task,
    );

    return {
      task,
      message: 'Review submitted successfully',
    };
  }
}
