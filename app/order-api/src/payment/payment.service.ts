import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Repository } from 'typeorm';
import { CashStrategy } from './strategy/cash.strategy';
import { BankTransferStrategy } from './strategy/bank-transfer.strategy';
import { InternalStrategy } from './strategy/internal.strategy';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  CreatePaymentDto,
  GetSpecificPaymentRequestDto,
  PaymentResponseDto,
} from './payment.dto';
import { Order } from 'src/order/order.entity';
import { v4 as uuidv4 } from 'uuid';
import * as _ from 'lodash';
import { PaymentException } from './payment.exception';
import { PaymentValidation } from './payment.validation';
import { PaymentMethod, PaymentStatus } from './payment.constants';
import {
  ACBResponseDto,
  ACBStatusRequestDto,
} from 'src/acb-connector/acb-connector.dto';
import { formatMoment } from 'src/helper';
import {
  ACBConnectorStatus,
  ACBConnectorTransactionStatus,
} from 'src/acb-connector/acb-connector.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectMapper() private readonly mapper: Mapper,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly cashStrategy: CashStrategy,
    private readonly bankTransferStrategy: BankTransferStrategy,
    private readonly internalStrategy: InternalStrategy,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get specific payment
   * @param {GetSpecificPaymentRequestDto} query
   * @returns {Promise<PaymentResponseDto>} payment
   */
  async getSpecific(
    query: GetSpecificPaymentRequestDto,
  ): Promise<PaymentResponseDto> {
    if (_.isEmpty(query)) {
      throw new PaymentException(PaymentValidation.PAYMENT_QUERY_INVALID);
    }
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: query.transaction },
    });
    return this.mapper.map(payment, Payment, PaymentResponseDto);
  }

  /**
   * Initiate payment
   * @param {CreatePaymentDto} createPaymentDto
   * @returns {Promise<PaymentResponseDto>} payment
   */
  async initiate(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const context = `${PaymentService.name}.${this.initiate.name}`;
    // get order
    const order = await this.orderRepository.findOne({
      where: { slug: createPaymentDto.orderSlug },
      relations: ['owner'],
    });
    if (!order) {
      this.logger.error('Order not found', context);
      throw new BadRequestException('Order not found');
    }

    let payment: Payment;

    switch (createPaymentDto.paymentMethod) {
      case PaymentMethod.BANK_TRANSFER:
        payment = await this.bankTransferStrategy.process(order);
        break;
      case PaymentMethod.CASH:
        payment = await this.cashStrategy.process(order);
        break;
      default:
        this.logger.error('Invalid payment method', context);
        throw new PaymentException(PaymentValidation.PAYMENT_METHOD_INVALID);
    }

    // Update order
    Object.assign(order, {
      payment,
    });
    await this.orderRepository.save(order);
    return this.mapper.map(payment, Payment, PaymentResponseDto);
  }

  /**
   * Callback update payment status
   * @param {CallbackUpdatePaymentStatusRequestDto} requestData
   * @returns {Promise<PaymentResponseDto>} payment
   * @throws {PaymentException}
   */
  async callback(requestData: ACBStatusRequestDto): Promise<ACBResponseDto> {
    const context = `${PaymentService.name}.${this.callback.name}`;
    // Get transaction from request data
    const transaction =
      requestData.requestParameters?.request?.requestParams?.transactions?.[0];
    if (!transaction) {
      this.logger.error('Transaction not found', context);
      throw new PaymentException(PaymentValidation.TRANSACTION_NOT_FOUND);
    }

    const payment = await this.paymentRepository.findOne({
      where: {
        transactionId: transaction.transactionEntityAttribute.traceNumber,
      },
      relations: ['order'],
    });

    if (!payment) {
      this.logger.error('Payment not found', context);
      throw new PaymentException(PaymentValidation.PAYMENT_NOT_FOUND);
    }

    const statusCode =
      transaction.transactionStatus === ACBConnectorTransactionStatus.COMPLETED
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED;

    Object.assign(payment, {
      statusCode: statusCode,
      statusMessage: statusCode,
    });

    const updatedPayment = await this.paymentRepository.save(payment);
    this.logger.log(`Payment ${updatedPayment.id}`, context);

    // Update order status
    this.eventEmitter.emit('payment.paid', { orderId: payment.order?.id });

    // return data for acb
    const response = {
      requestTrace: uuidv4(),
      responseDateTime: formatMoment(),
      responseStatus: {
        responseCode:
          transaction?.transactionStatus ===
          ACBConnectorTransactionStatus.COMPLETED
            ? ACBConnectorStatus.SUCCESS
            : ACBConnectorStatus.BAD_REQUEST,
        responseMessage: transaction?.transactionStatus,
      },
      responseBody: {
        index: 1,
        referenceCode: payment.slug,
      },
    } as ACBResponseDto;
    return response;
  }
}
