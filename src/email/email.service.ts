import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not fully configured. Email service may not work.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || 'noreply@example.com';
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Welcome to Netah!',
        html: `
          <h1>Welcome ${firstName}!</h1>
          <p>Thank you for joining Netah. We're excited to have you on board.</p>
          <p>Start exploring tasks or post your own to get started.</p>
        `,
      });

      this.logger.log(`Welcome email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
      return { success: false, error };
    }
  }

  async sendTaskAssignedEmail(
    to: string,
    recipientName: string,
    taskTitle: string,
    taskPublicId: string,
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Your bid was accepted!',
        html: `
          <h1>Congratulations ${recipientName}!</h1>
          <p>Your bid on "<strong>${taskTitle}</strong>" was accepted.</p>
          <p>The task is now assigned to you. Good luck!</p>
          <a href="${this.configService.get('FRONTEND_URL')}/tasks/${taskPublicId}">View Task</a>
        `,
      });

      this.logger.log(`Task assigned email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending task assigned email', error);
      return { success: false, error };
    }
  }

  async sendNewBidEmail(
    to: string,
    posterName: string,
    bidderName: string,
    taskTitle: string,
    bidAmount: number,
    taskPublicId: string,
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'New bid on your task',
        html: `
          <h1>New Bid Received</h1>
          <p>Hi ${posterName},</p>
          <p><strong>${bidderName}</strong> placed a bid of <strong>₦${bidAmount}</strong> on your task "<strong>${taskTitle}</strong>".</p>
          <a href="${this.configService.get('FRONTEND_URL')}/tasks/${taskPublicId}">View Bids</a>
        `,
      });

      this.logger.log(`New bid email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending new bid email', error);
      return { success: false, error };
    }
  }

  async sendTaskCompletedEmail(
    to: string,
    posterName: string,
    taskTitle: string,
    taskPublicId: string,
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Task completed - awaiting approval',
        html: `
          <h1>Task Completed</h1>
          <p>Hi ${posterName},</p>
          <p>The runner has marked "<strong>${taskTitle}</strong>" as completed.</p>
          <p>Please review and approve the task to release funds.</p>
          <a href="${this.configService.get('FRONTEND_URL')}/tasks/${taskPublicId}">Review Task</a>
        `,
      });

      this.logger.log(`Task completed email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending task completed email', error);
      return { success: false, error };
    }
  }

  async sendPasswordResetOtp(to: string, otp: string, firstName: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Reset your password - OTP',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${firstName},</p>
          <p>Your OTP for password reset is:</p>
          <h2 style="letter-spacing: 5px; font-size: 32px;">${otp}</h2>
          <p>This OTP will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      this.logger.log(`Password reset OTP sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending password reset OTP', error);
      return { success: false, error };
    }
  }

  async sendGenericEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      this.logger.log(`Generic email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending generic email', error);
      return { success: false, error };
    }
  }
}
