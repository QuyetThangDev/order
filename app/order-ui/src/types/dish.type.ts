import { IBase } from './base.type'
import { ICatalog } from './catalog.type'
import { IProduct, IProductVariant } from './product.type'
import { ISize } from './size.type'

export interface IDish {
  id: number
  image: string
  name: string
  price: number
  description: string
  type: string
  main_ingredients: string[]
  availability: boolean
  preparation_time: number
  discount: number
  calories: number
}

export interface ICartItem {
  id: string
  slug: string
  owner?: string
  ownerPhoneNumber?: string
  type: string
  branch?: string
  orderItems: IOrderItem[]
  table?: string
  note?: string
}

export interface IOrderItem {
  id: string
  slug: string
  image: string
  name: string
  quantity: number
  variant: string
  price: number
  description: string
  isLimit: boolean
  catalog: ICatalog
  note?: string
}

export interface IOrder {
  createdAt: string
  slug: string
  type: string
  tableName: string
  branch: string
  owner: {
    phonenumber: string
    firstName: string
    lastName: string
    createdAt: string
    slug: string
  }
  subtotal: number
  orderItems: IOrderDetail[]
  status: OrderStatus
}

export interface IOrderDetail extends IBase {
  id: string
  note: string
  quantity: number
  status: {
    pending: number
    completed: number
    failed: number
    running: number
  }
  subtotal: number
  variant: IProductVariant
  size: ISize
}

export enum OrderStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

export enum OrderItemStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum IOrderType {
  AT_TABLE = 'at-table',
  TAKE_AWAY = 'take-away',
}

export interface ICreateOrderResponse extends IBase {
  subtotal: number
  type: string
  tableName: string
  branch: string
  owner: {
    phonenumber: string
    firstName: string
    lastName: string
    createdAt: string
    slug: string
  }
  orderItems: {
    quantity: number
    subtotal: number
    variant: {
      price: number
      createdAt: string
      slug: string
      product: IProduct
    }
    note: string
    slug: string
  }[]
}

export interface ICreateOrderRequest {
  type: string
  table: string
  branch: string
  owner: string
  orderItems: {
    quantity: number
    variant: string
    note: string
  }[]
}

export interface IInitiateQrCodeRequest {
  paymentMethod: string
  orderSlug: string
}

export interface IInitiateQrCodeResponse {
  requestTrace: string
  qrCode: string
}

export interface IOrderTracking extends IBase {
  status: string
  trackingOrderItems: {
    quantity: number
    orderItem: {
      quantity: number
      subtotal: number
      note: string
      createdAt: string
      slug: string
    }
    createdAt: string
    slug: string
  }
}

export interface ICreateOrderTrackingRequest {
  type: string
  trackingOrderItems: {
    quantity: number
    orderItem: string
  }[]
}
