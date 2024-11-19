import { http } from '@/utils'
import { IApiResponse, ICatalog, ICreateCatalogRequest, IUpdateCatalogRequest } from '@/types'

export async function getCatalog(): Promise<IApiResponse<ICatalog>> {
  const response = await http.get<IApiResponse<ICatalog>>('/catalogs')
  return response.data
}

export async function createCatalog(
  params: ICreateCatalogRequest
): Promise<IApiResponse<ICatalog>> {
  const response = await http.post<IApiResponse<ICatalog>>('/catalogs', params)
  return response.data
}

export async function updateCatalog(
  params: IUpdateCatalogRequest
): Promise<IApiResponse<ICatalog>> {
  const response = await http.patch<IApiResponse<ICatalog>>(`/catalogs/${params.slug}`, params)
  return response.data
}

export async function deleteCatalog(slug: string): Promise<IApiResponse<ICatalog>> {
  const response = await http.delete<IApiResponse<ICatalog>>(`/catalogs/${slug}`)
  return response.data
}