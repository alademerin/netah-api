import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ResponseMessage } from 'src/response/response.decorator';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { MustChangePasswordGuard } from 'src/auth/guards/must-change-password.guard';
import { Must2FAGuard } from 'src/auth/guards/must-2fa.guard';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Payment, PaymentStatus } from './entities/payment.entity';

@UseGuards(AdminJwtAuthGuard, MustChangePasswordGuard, Must2FAGuard)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly tasksService: TasksService,
    @InjectRepository(Payment)
    private readonly paymentRepo: EntityRepository<Payment>,
  ) {}

  @ResponseMessage('All payments retrieved successfully!')
  @Get()
  async findAllPayments() {
    const payments = await this.paymentRepo.findAll({
      populate: ['taskBid', 'paidBy'],
      orderBy: { createdAt: 'DESC' },
    });
    return payments;
  }

  @ResponseMessage('Payment retrieved successfully!')
  @Get(':id')
  async findPaymentById(@Param('id') id: string) {
    const payment = await this.paymentRepo.findOne(
      { id: +id },
      { populate: ['taskBid', 'paidBy'] },
    );
    return payment;
  }

  @ResponseMessage('Payment statistics retrieved successfully!')
  @Get('stats/overview')
  async getPaymentStats() {
    const totalPayments = await this.paymentRepo.count();
    const completedPayments = await this.paymentRepo.count({ status: PaymentStatus.COMPLETED });
    const pendingPayments = await this.paymentRepo.count({ status: PaymentStatus.PENDING });
    const failedPayments = await this.paymentRepo.count({ status: PaymentStatus.FAILED });

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
    };
  }
}
