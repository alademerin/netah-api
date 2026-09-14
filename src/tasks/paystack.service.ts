import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly paystackSecretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private configService: ConfigService) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(data: {
    email: string;
    amount: number; // Amount in kobo (multiply naira by 100)
    reference: string;
    metadata?: any;
    callback_url?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Paystack initialization failed:', result);
        throw new Error(result.message || 'Failed to initialize payment');
      }

      return result;
    } catch (error) {
      this.logger.error('Error initializing Paystack transaction:', error);
      throw error;
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<{
    status: boolean;
    message: string;
    data: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      gateway_response: string;
      paid_at: string;
      created_at: string;
      channel: string;
      currency: string;
      metadata: any;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error('Paystack verification failed:', result);
        throw new Error(result.message || 'Failed to verify payment');
      }

      return result;
    } catch (error) {
      this.logger.error('Error verifying Paystack transaction:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Generate a unique payment reference
   */
  generateReference(prefix = 'NETAH'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
