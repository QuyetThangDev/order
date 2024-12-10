import { IBase } from './base.type'
import { IProduct } from './product.type'

export interface IMenu extends IBase {
  date: string
  branchSlug: string
  isTemplate: boolean
  menuItems: IMenuItem[]
}

export interface ICreateMenuRequest {
  date: string
  branchSlug: string
}

export interface IAllMenuRequest {
  page: number | 1
  pageSize: number | 10
  order: 'ASC' | 'DESC'
  branch?: string
}

export interface ISpecificMenuRequest {
  slug?: string // This is the slug of the menu
  date?: string
  branch?: string
}

export interface IUpdateMenuRequest {
  slug: string // This is the slug of the menu
  date: string
  branchSlug: string
}

export interface ISpecificMenu extends IBase {
  date: string
  menuItems: IMenuItem[]
  dayIndex: number
  isTemplate: boolean
}

export interface IMenuItem extends IBase {
  currentStock: number
  defaultStock: number
  product: IProduct
}

export interface ICreateMenuRequest {
  date: string
  branchSlug: string
}

export interface IUpdateMenuRequest {
  slug: string // This is the slug of the menu
  date: string
  branchSlug: string
}

export interface IAddMenuItemRequest {
  menuSlug: string
  productName?: string
  productSlug: string
  defaultStock: number
}

export interface IUpdateMenuItemRequest {
  slug: string
  menuSlug: string
  productName?: string
  productSlug: string
  defaultStock: number
}

export interface IMenuItemStore {
  menuItems: IAddMenuItemRequest[] // Thay đổi từ string[] sang IAddMenuItemRequest[]
  getMenuItems: () => IAddMenuItemRequest[]
  addMenuItem: (item: IAddMenuItemRequest) => void
  removeMenuItem: (productSlug: string) => void
  clearMenuItems: () => void
}
