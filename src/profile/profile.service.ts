import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { User } from 'src/users/entities/user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Payment } from 'src/tasks/entities/payment.entity';
import { TaskStatusEnum } from 'src/tasks/dto/create-task.dto';
import { PaymentStatus } from 'src/tasks/entities/payment.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileVisibilityDto } from './dto/update-profile-visibility.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';

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
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getUserReviews(userUuid: string) {
    const user = await this.userRepo.findOne({ uuid: userUuid });

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
        uuid: task.postedBy.uuid,
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
        uuid: task.assignedTo!.uuid,
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

  async getProfile(userId: number): Promise<any> {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get tasks posted count
    const tasksPosted = await this.taskRepo.count({
      postedBy: user,
    });

    // Get completed tasks count
    const completedTasks = await this.taskRepo.count({
      assignedTo: user,
      status: TaskStatusEnum.COMPLETED,
    });

    // Get reviews and calculate rating
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

    // Calculate on-time rate
    let onTimeRate = 0;
    if (completedTasks > 0) {
      const tasksNotDisputed = await this.taskRepo.count({
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
        disputeReason: null,
      });
      onTimeRate = parseFloat(((tasksNotDisputed / completedTasks) * 100).toFixed(1));
    }

    // Calculate response rate (placeholder)
    const responseRate = tasksPosted > 0 ? 100 : 0;

    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      city: user.city,
      bio: user.bio,
      skills: user.skills || [],
      profileImage: user.profileImage,
      registeredAs: user.registeredAs,
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
      smsNotifications: user.smsNotifications,
      notifyNewBids: user.notifyNewBids,
      notifyTaskUpdates: user.notifyTaskUpdates,
      notifyPaymentAlerts: user.notifyPaymentAlerts,
      notifyWeeklyDigest: user.notifyWeeklyDigest,
      notifyPromotions: user.notifyPromotions,
      showLocation: user.showLocation,
      showRating: user.showRating,
      showCompletedTasksCount: user.showCompletedTasksCount,
      allowDirectMessages: user.allowDirectMessages,
      createdAt: user.createdAt,
      tasksPosted,
      completedTasksCount: completedTasks,
      rating: avgRating,
      totalReviews: allRatings.length,
      onTimeRate,
      responseRate,
    };
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

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update to new password (will be hashed by @BeforeUpdate hook)
    user.password = changePasswordDto.newPassword;
    await this.em.flush();
  }

  async getNotificationPreferences(userId: number) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      channels: {
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false,
      },
      preferences: {
        notifyNewBids: user.notifyNewBids ?? true,
        notifyTaskUpdates: user.notifyTaskUpdates ?? true,
        notifyPaymentAlerts: user.notifyPaymentAlerts ?? true,
        notifyWeeklyDigest: user.notifyWeeklyDigest ?? false,
        notifyPromotions: user.notifyPromotions ?? true,
      },
    };
  }

  async updateNotificationPreferences(
    userId: number,
    updateDto: UpdateNotificationPreferencesDto,
  ) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out undefined values
    const filteredDto = Object.fromEntries(
      Object.entries(updateDto).filter(([_, value]) => value !== undefined)
    );

    this.userRepo.assign(user, filteredDto);
    await this.em.flush();

    return {
      channels: {
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false,
      },
      preferences: {
        notifyNewBids: user.notifyNewBids ?? true,
        notifyTaskUpdates: user.notifyTaskUpdates ?? true,
        notifyPaymentAlerts: user.notifyPaymentAlerts ?? true,
        notifyWeeklyDigest: user.notifyWeeklyDigest ?? false,
        notifyPromotions: user.notifyPromotions ?? true,
      },
    };
  }

  async getProfileVisibility(userId: number) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      showLocation: user.showLocation ?? true,
      showRating: user.showRating ?? true,
      showCompletedTasksCount: user.showCompletedTasksCount ?? true,
      allowDirectMessages: user.allowDirectMessages ?? true,
    };
  }

  async updateProfileVisibility(userId: number, updateDto: UpdateProfileVisibilityDto) {
    const user = await this.userRepo.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out undefined values
    const filteredDto = Object.fromEntries(
      Object.entries(updateDto).filter(([_, value]) => value !== undefined)
    );

    this.userRepo.assign(user, filteredDto);
    await this.em.flush();

    return {
      showLocation: user.showLocation ?? true,
      showRating: user.showRating ?? true,
      showCompletedTasksCount: user.showCompletedTasksCount ?? true,
      allowDirectMessages: user.allowDirectMessages ?? true,
    };
  }

  async getPublicProfile(userUuid: string) {
    const user = await this.userRepo.findOne({ uuid: userUuid });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build base profile (always shown)
    const profile: any = {
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      skills: user.skills || [],
      profileImage: user.profileImage,
      registeredAs: user.registeredAs,
      createdAt: user.createdAt,
      allowDirectMessages: user.allowDirectMessages ?? true,
    };

    // Get tasks posted count (always show)
    const tasksPosted = await this.taskRepo.count({
      postedBy: user,
    });
    profile.tasksPosted = tasksPosted;

    // Conditionally add location
    if (user.showLocation ?? true) {
      profile.address = user.address;
      profile.city = user.city;
    }

    // Conditionally add rating
    if (user.showRating ?? true) {
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

      profile.rating = avgRating;
      profile.totalReviews = allRatings.length;
    }

    // Conditionally add completed tasks count
    if (user.showCompletedTasksCount ?? true) {
      const completedTasks = await this.taskRepo.count({
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
      });

      profile.completedTasksCount = completedTasks;
    }

    // Calculate on-time rate (always show for runners)
    const totalCompletedAsRunner = await this.taskRepo.count({
      assignedTo: user,
      status: TaskStatusEnum.COMPLETED,
    });

    if (totalCompletedAsRunner > 0) {
      // Count tasks completed on time (completed at or before deadline)
      // For now, we'll use a simple metric - tasks that weren't disputed
      const tasksNotDisputed = await this.taskRepo.count({
        assignedTo: user,
        status: TaskStatusEnum.COMPLETED,
        disputeReason: null,
      });

      profile.onTimeRate = parseFloat(((tasksNotDisputed / totalCompletedAsRunner) * 100).toFixed(1));
    } else {
      profile.onTimeRate = 0;
    }

    // Calculate response rate (always show)
    // Response rate = tasks with bids / total open tasks posted
    // This is a simplified metric
    const totalTasksPosted = await this.taskRepo.count({
      postedBy: user,
    });

    if (totalTasksPosted > 0) {
      // For simplicity, we'll use 100% as default since we don't track response times yet
      // TODO: Implement proper response rate tracking
      profile.responseRate = 100;
    } else {
      profile.responseRate = 0;
    }

    return profile;
  }

  async uploadProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepo.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old image from Cloudinary if exists
    if (user.profileImagePublicId) {
      await this.cloudinaryService.deleteImage(user.profileImagePublicId);
    }

    // Upload new image
    const { url, publicId } = await this.cloudinaryService.uploadImage(file, 'netah/profiles');

    // Update user
    user.profileImage = url;
    user.profileImagePublicId = publicId;
    await this.em.flush();

    return {
      profileImage: url,
    };
  }

  async deleteProfileImage(userId: number) {
    const user = await this.userRepo.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profileImage) {
      throw new NotFoundException('No profile image to delete');
    }

    // Delete from Cloudinary
    if (user.profileImagePublicId) {
      await this.cloudinaryService.deleteImage(user.profileImagePublicId);
    }

    // Clear from database
    user.profileImage = undefined;
    user.profileImagePublicId = undefined;
    await this.em.flush();

    return {
      message: 'Profile image deleted successfully',
    };
  }
}
