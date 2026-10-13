import { httpClient, type IHttpClient } from '../http';
import type {
  AuthUser,
  ConfirmPasswordResetDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  UpdateProfileDto,
} from '../types';

export interface IAuthService {
  login(dto: LoginDto): Promise<{ user: AuthUser }>;
  register(dto: RegisterDto): Promise<{ user: AuthUser }>;
  refresh(): Promise<{ user: AuthUser }>;
  getMe(): Promise<{ user: AuthUser }>;
  updateProfile(dto: UpdateProfileDto): Promise<{ user: AuthUser }>;
  requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ ok: boolean }>;
  requestPasswordResetForCurrentUser(): Promise<{ ok: boolean }>;
  confirmPasswordReset(dto: ConfirmPasswordResetDto): Promise<{ ok: boolean }>;
  logout(): Promise<{ ok: boolean }>;
}

export class AuthService implements IAuthService {
  constructor(private readonly client: IHttpClient = httpClient) {}

  login(dto: LoginDto): Promise<{ user: AuthUser }> {
    return this.client.post<{ user: AuthUser }>('/auth/login', dto);
  }

  register(dto: RegisterDto): Promise<{ user: AuthUser }> {
    return this.client.post<{ user: AuthUser }>('/auth/register', {
      ...dto,
      email: dto.email || undefined,
      phone: dto.phone || undefined,
    });
  }

  refresh(): Promise<{ user: AuthUser }> {
    return this.client.post<{ user: AuthUser }>('/auth/refresh');
  }

  getMe(): Promise<{ user: AuthUser }> {
    return this.client.get<{ user: AuthUser }>('/auth/me');
  }

  updateProfile(dto: UpdateProfileDto): Promise<{ user: AuthUser }> {
    return this.client.patch<{ user: AuthUser }>('/auth/profile', dto);
  }

  requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>('/auth/password-reset/request', dto);
  }

  requestPasswordResetForCurrentUser(): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>('/auth/password-reset/request-me');
  }

  confirmPasswordReset(dto: ConfirmPasswordResetDto): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>('/auth/password-reset/confirm', dto);
  }

  logout(): Promise<{ ok: boolean }> {
    return this.client.post<{ ok: boolean }>('/auth/logout');
  }
}

export const authService: IAuthService = new AuthService();
