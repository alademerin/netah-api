import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCategoryDto } from './dto/create-task-category.dto';
import { ResponseMessage } from 'src/response/response.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user-decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CreateTaskBidDto } from './dto/create-task-bid.dto';
import { CounterTaskBidDto } from './dto/counter-task-bid.dto';
import { ApproveTaskDto } from './dto/approve-task.dto';
import { DisputeTaskDto } from './dto/dispute-task.dto';
import { ReviewPosterDto } from './dto/review-poster.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ResponseMessage('Task posted successfully!')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() currentUser: User) {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@CurrentUser() currentUser?: User) {
    return this.tasksService.findAll(currentUser);
  }

  @ResponseMessage('Task category retrieved successfully!')
  @Get('category')
  finaAllCategories() {
    return this.tasksService.findAllCategories();
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Tasks by logged in user retrieved successfully!')
  @Get('me')
  findMyTasks(@CurrentUser() currentUser: User) {
    return this.tasksService.findMyTasks(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('User bids retrieved successfully!')
  @Get('bids/me')
  getMyBids(@CurrentUser() currentUser: User) {
    return this.tasksService.getMyBids(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Assigned tasks retrieved successfully!')
  @Get('assigned/me')
  getMyAssignedTasks(@CurrentUser() currentUser: User): Promise<any[]> {
    return this.tasksService.getMyAssignedTasks(currentUser);
  }

  @Delete('category/:id')
  removeCategory(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOneByUuid(@Param('id') id: string, @CurrentUser() currentUser: User): Promise<any> {
    return this.tasksService.findOneByUuid(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task updated successfully!')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task image uploaded successfully!')
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  async uploadTaskImage(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (jpeg, png, jpg, webp) are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    return this.tasksService.uploadTaskImage(id, currentUser, file);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task image deleted successfully!')
  @Delete(':id/images/:imageIndex')
  deleteTaskImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.deleteTaskImage(id, +imageIndex, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task category created successfully!')
  @Post('category')
  createCategory(@Body() createTaskCategoryDto: CreateTaskCategoryDto) {
    return this.tasksService.createCategory(createTaskCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid sent successfully!')
  @Post(':id/bids')
  createBid(
    @Param('id') id: string,
    @Body() createTaskBidDto: CreateTaskBidDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.createBid(id, createTaskBidDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid gotten successfully!')
  @Get(':id/bid')
  getUserBid(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.tasksService.getUserBid(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid gotten successfully!')
  @Get(':id/bids')
  getTaskBids(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.tasksService.getTaskBids(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid countered successfully!')
  @Post(':id/bids/:bidId/counter')
  counterTaskBid(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @Body() counterTaskBidDto: CounterTaskBidDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.counterTaskBid(id, bidId, counterTaskBidDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid history fetched successfully!')
  @Get(':id/bids/:bidId/history')
  getTaskBidHistory(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.getTaskBidHistory(id, bidId, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Payment breakdown retrieved successfully!')
  @Get(':id/bids/:bidId/payment-breakdown')
  getPaymentBreakdown(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.getPaymentBreakdown(id, bidId, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Payment initialized. Complete payment to accept bid.')
  @Post(':id/bids/:bidId/accept')
  acceptTaskBid(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.acceptTaskBid(id, bidId, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task bid rejected successfully!')
  @Post(':id/bids/:bidId/reject')
  rejectTaskBid(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.rejectTaskBid(id, bidId, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Bid withdrawn successfully!')
  @Post(':id/bids/:bidId/withdraw')
  withdrawBid(
    @Param('id') id: string,
    @Param('bidId') bidId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.withdrawBid(id, bidId, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task marked as completed successfully!')
  @Post(':id/complete')
  markTaskAsCompleted(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.tasksService.markTaskAsCompleted(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Completion template retrieved successfully!')
  @Get(':id/complete/template')
  getCompletionDetails(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.tasksService.getCompletionDetails(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Funds released successfully!')
  @Post(':id/approve')
  approveAndReleaseFunds(
    @Param('id') id: string,
    @Body() approveTaskDto: ApproveTaskDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.approveAndReleaseFunds(id, approveTaskDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Dispute submitted successfully!')
  @Post(':id/dispute')
  disputeTask(
    @Param('id') id: string,
    @Body() disputeTaskDto: DisputeTaskDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.disputeTask(id, disputeTaskDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Poster review submitted successfully!')
  @Post(':id/review-poster')
  reviewPoster(
    @Param('id') id: string,
    @Body() reviewPosterDto: ReviewPosterDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.tasksService.reviewPoster(id, reviewPosterDto, currentUser);
  }

  @ResponseMessage('Payment verified successfully!')
  @Post('payments/verify/:reference')
  verifyPayment(@Param('reference') reference: string): Promise<any> {
    return this.tasksService.verifyPayment(reference);
  }

  @Post('payments/webhook')
  async handlePaystackWebhook(@Headers('x-paystack-signature') signature: string, @Body() body: any) {
    // Verify webhook signature
    const isValid = this.tasksService['paystackService'].verifyWebhookSignature(
      signature,
      JSON.stringify(body),
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle the webhook event
    if (body.event === 'charge.success') {
      const reference = body.data.reference;
      await this.tasksService.verifyPayment(reference);
    }

    return { status: 'success' };
  }
}
