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
      secure: smtpPort === 465, // true for 465, false for other ports (587 uses STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      requireTLS: smtpPort === 587, // Require STARTTLS for port 587
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
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

  async sendAdminCreatedEmail(
    to: string,
    firstName: string,
    lastName: string,
    temporaryPassword: string,
  ) {
    const loginUrl = `${this.configService.get('ADMIN_PORTAL_URL') || 'https://netah-back.onrender.com'}/admin/login`;

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Welcome to Netah Admin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                color: #ffffff;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
                color: #333333;
                line-height: 1.6;
              }
              .content h2 {
                color: #10b981;
                font-size: 24px;
                margin-top: 0;
                margin-bottom: 20px;
              }
              .content p {
                margin: 15px 0;
                font-size: 16px;
              }
              .credentials-box {
                background-color: #f8f9fa;
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .credentials-box .label {
                font-weight: 600;
                color: #10b981;
                margin-bottom: 5px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .credentials-box .value {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                color: #333333;
                margin: 5px 0 15px 0;
                word-break: break-all;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .steps {
                background-color: #f8f9fa;
                border-radius: 6px;
                padding: 20px;
                margin: 25px 0;
              }
              .steps h3 {
                color: #10b981;
                font-size: 18px;
                margin-top: 0;
                margin-bottom: 15px;
              }
              .steps ol {
                margin: 0;
                padding-left: 20px;
              }
              .steps li {
                margin: 10px 0;
                font-size: 15px;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                font-size: 14px;
                color: #856404;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
              }
              .footer a {
                color: #10b981;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Netah Admin</h1>
              </div>

              <div class="content">
                <h2>Hello ${firstName} ${lastName}!</h2>

                <p>
                  You have been added as an administrator on the Netah platform.
                  As an admin, you'll have access to manage tasks, users, and payments across the platform.
                </p>

                <div class="credentials-box">
                  <div class="label">Your Email</div>
                  <div class="value">${to}</div>

                  <div class="label">Temporary Password</div>
                  <div class="value">${temporaryPassword}</div>
                </div>

                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong><br>
                  This is a temporary password. You will be required to change it immediately upon your first login for security purposes.
                </div>

                <div style="text-align: center;">
                  <a href="${loginUrl}" class="button">Login to Admin Portal</a>
                </div>

                <div class="steps">
                  <h3>📋 Getting Started</h3>
                  <ol>
                    <li>Click the button above or visit the admin login page</li>
                    <li>Login with your email and temporary password</li>
                    <li>You'll be prompted to change your password</li>
                    <li>Set up Two-Factor Authentication (2FA) for enhanced security</li>
                    <li>Start managing the platform!</li>
                  </ol>
                </div>

                <p style="margin-top: 30px;">
                  <strong>Need Help?</strong><br>
                  If you have any questions or need assistance, please contact the system administrator.
                </p>
              </div>

              <div class="footer">
                <p>
                  This email was sent by Netah<br>
                  <a href="${this.configService.get('FRONTEND_URL') || 'https://netah.onrender.com'}">Visit Website</a>
                </p>
                <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                  © ${new Date().getFullYear()} Netah. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`Admin created email sent to ${to}: ${info.messageId}`);
      return { success: true, data: info };
    } catch (error) {
      this.logger.error('Error sending admin created email', error);
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
