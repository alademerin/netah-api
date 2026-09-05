import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { User } from 'src/users/entities/user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Payment } from 'src/tasks/entities/payment.entity';
import { TaskStatusEnum } from 'src/tasks/dto/create-task.dto';
import { PaymentStatus } from 'src/tasks/entities/payment.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,

    @InjectRepository(Task)
    private readonly taskRepo: EntityRepository<Task>,

    @InjectRepository(Payment)
    private readonly paymentRepo: EntityRepository<Payment>,

    private readonly em: EntityManager,
  ) {}

  async getUserReviews(userId: number) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get reviews where user was the runner (received rating from poster)
    const runnerReviews = await this.taskRepo.find(
      {
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
        rating: { $ne: null },
      },
      {
        populate: ['postedBy', 'category'],
        orderBy: { completedAt: 'DESC' },
      },
    );

    // Get reviews where user was the poster (received rating from runner)
    const posterReviews = await this.taskRepo.find(
      {
        postedBy: user,
        status: TaskStatusEnum.COMPLETED,
        posterRating: { $ne: null },
      },
      {
        populate: ['assignedTo', 'category'],
        orderBy: { completedAt: 'DESC' },
      },
    );

    const runnerReviewsFormatted = runnerReviews.map((task) => ({
      id: task.id,
      taskTitle: task.title,
      category: task.category.name,
      rating: task.rating,
      review: task.feedback,
      reviewedBy: {
        id: task.postedBy.id,
        firstName: task.postedBy.firstName,
        lastName: task.postedBy.lastName,
      },
      reviewType: 'runner',
      completedAt: task.completedAt,
    }));

    const posterReviewsFormatted = posterReviews.map((task) => ({
      id: task.id,
      taskTitle: task.title,
      category: task.category.name,
      rating: task.posterRating,
      review: task.posterReview,
      reviewedBy: {
        id: task.assignedTo!.id,
        firstName: task.assignedTo!.firstName,
        lastName: task.assignedTo!.lastName,
      },
      reviewType: 'poster',
      completedAt: task.completedAt,
    }));

    // Combine and sort by date
    const allReviews = [...runnerReviewsFormatted, ...posterReviewsFormatted].sort(
      (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0),
    );

    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
        : 0;

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      stats: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        runnerReviews: runnerReviewsFormatted.length,
        posterReviews: posterReviewsFormatted.length,
      },
      reviews: allReviews,
    };
  }

  async getDashboardSummary(userId: number) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get completed tasks where user was the runner
    const completedTasks = await this.taskRepo.count({
      assignedTo: user,
      status: TaskStatusEnum.COMPLETED,
    });

    // Get tasks posted by user
    const tasksPosted = await this.taskRepo.count({
      postedBy: user,
    });

    // Calculate total earnings (bidAmount from completed tasks where user was runner)
    const payments = await this.paymentRepo.find(
      {
        taskBid: {
          task: {
            assignedTo: user,
            status: TaskStatusEnum.COMPLETED,
          },
        },
        status: PaymentStatus.COMPLETED,
      },
      { populate: ['taskBid', 'taskBid.task'] },
    );

    const totalEarnings = payments.reduce((sum, payment) => sum + payment.bidAmount, 0);

    // Get reviews where user was the runner (received rating from poster)
    const runnerReviews = await this.taskRepo.find({
      assignedTo: user,
      status: TaskStatusEnum.COMPLETED,
      rating: { $ne: null },
    });

    // Get reviews where user was the poster (received rating from runner)
    const posterReviews = await this.taskRepo.find({
      postedBy: user,
      status: TaskStatusEnum.COMPLETED,
      posterRating: { $ne: null },
    });

    // Calculate average rating
    const allRatings = [
      ...runnerReviews.map((t) => t.rating!),
      ...posterReviews.map((t) => t.posterRating!),
    ];

    const avgRating =
      allRatings.length > 0
        ? parseFloat((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1))
        : 0;

    return {
      totalEarnings,
      tasksCompleted: completedTasks,
      tasksPosted,
      avgRating,
    };
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it already exists
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        email: updateProfileDto.email,
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check if phone number is being updated and if it already exists
    if (updateProfileDto.phoneNumber && updateProfileDto.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.userRepo.findOne({
        phoneNumber: updateProfileDto.phoneNumber,
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use');
      }
    }

    // Filter out undefined values to avoid assignment errors
    const filteredDto = Object.fromEntries(
      Object.entries(updateProfileDto).filter(([_, value]) => value !== undefined)
    );

    this.userRepo.assign(user, filteredDto);
    await this.em.flush();
    return user;
  }
}
