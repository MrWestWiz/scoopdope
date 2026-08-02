import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Course } from '../courses/course.entity';
import { CurrencyConversionService, SupportedCurrency } from './currency-conversion.service';
import { CouponsService } from '../coupons/coupons.service';

interface OrderPreview {
  courseId: string;
  courseTitle: string;
  originalPriceUsd: number;
  originalPrice: number;
  currency: SupportedCurrency;
  discountApplied: number;
  finalPriceUsd: number;
  finalPrice: number;
  hasCoupon: boolean;
  couponCode?: string;
  currencyNote?: string;
}

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private currencyConversion: CurrencyConversionService,
    private couponsService: CouponsService,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey') || '', {
      apiVersion: '2025-01-27' as any,
    });
  }

  /**
   * Sanitize PaymentIntent for logging — only include non-sensitive fields
   * Excludes: card details, billing address, customer email, etc. (PCI DSS requirement 3)
   */
  private sanitizePaymentIntent(intent: Stripe.PaymentIntent): Record<string, unknown> {
    return {
      id: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      created: intent.created,
    };
  }

  async createPaymentIntent(
    courseId: string,
    currency: SupportedCurrency,
    userId: string,
    couponCode?: string,
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.priceUsd || course.priceUsd <= 0) {
      throw new BadRequestException('This course is free and does not require payment');
    }

    let priceUsd = Number(course.priceUsd);
    let discountApplied = 0;

    if (couponCode) {
      const { valid, discount, discountType } = await this.couponsService.validateForCheckout(couponCode, priceUsd);
      if (valid) {
        discountApplied = discount;
        priceUsd = Math.max(0, priceUsd - discount);
        await this.couponsService.incrementUsage(couponCode);
      }
    }

    const amount = await this.currencyConversion.toStripeAmount(priceUsd, currency);

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: { courseId, userId, couponCode: couponCode ?? '' },
    });

    return {
      clientSecret: intent.client_secret,
      amount,
      currency,
      courseId,
      discountApplied,
      finalPriceUsd: priceUsd,
    };
  }

  async getPriceInCurrency(courseId: string, currency: SupportedCurrency) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const priceUsd = course.priceUsd ?? 0;
    const converted = priceUsd > 0 ? await this.currencyConversion.convertWithMetadata(priceUsd, currency) : { amount: 0 };

    return {
      courseId,
      priceUsd,
      currency,
      price: converted.amount,
      currencyNote: converted.currencyNote,
    };
  }

  async previewOrder(
    courseId: string,
    currency: SupportedCurrency,
    couponCode?: string,
  ): Promise<OrderPreview> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const originalPriceUsd = Number(course.priceUsd ?? 0);
    let finalPriceUsd = originalPriceUsd;
    let discountApplied = 0;
    let hasCoupon = false;

    if (couponCode && originalPriceUsd > 0) {
      const { valid, discount } = await this.couponsService.validateForCheckout(couponCode, originalPriceUsd);
      if (valid) {
        discountApplied = discount;
        finalPriceUsd = Math.max(0, originalPriceUsd - discount);
        hasCoupon = true;
      }
    }

    const converted = finalPriceUsd > 0
      ? await this.currencyConversion.convertWithMetadata(finalPriceUsd, currency)
      : { amount: 0 };

    const originalConverted = originalPriceUsd > 0
      ? await this.currencyConversion.convertWithMetadata(originalPriceUsd, currency)
      : { amount: 0 };

    return {
      courseId,
      courseTitle: course.title,
      originalPriceUsd,
      originalPrice: originalConverted.amount,
      currency,
      discountApplied,
      finalPriceUsd,
      finalPrice: converted.amount,
      hasCoupon,
      couponCode: hasCoupon ? couponCode : undefined,
      currencyNote: converted.currencyNote,
    };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret')!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      this.logger.log(
        `Payment succeeded: ${JSON.stringify(this.sanitizePaymentIntent(intent))}`,
      );
      // Enrollment logic can be triggered here via EventEmitter
    }
  }
}
