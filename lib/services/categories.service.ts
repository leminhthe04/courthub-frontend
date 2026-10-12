import { httpClient, type IHttpClient } from '../http';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';

export interface ICategoriesService {
  list(): Promise<Category[]>;
  adminList(): Promise<Category[]>;
  adminCreate(dto: CreateCategoryDto): Promise<Category>;
  adminUpdate(id: string, dto: UpdateCategoryDto): Promise<Category>;
  adminDelete(id: string): Promise<Category>;
}

export class CategoriesService implements ICategoriesService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  list(): Promise<Category[]> {
    return this.client.get<Category[]>('/categories');
  }

  adminList(): Promise<Category[]> {
    return this.client.get<Category[]>('/admin/categories');
  }

  adminCreate(dto: CreateCategoryDto): Promise<Category> {
    return this.client.post<Category>('/admin/categories', dto);
  }

  adminUpdate(id: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.client.patch<Category>(`/admin/categories/${id}`, dto);
  }

  adminDelete(id: string): Promise<Category> {
    return this.client.delete<Category>(`/admin/categories/${id}`);
  }
}

export const categoriesService: ICategoriesService = new CategoriesService();
