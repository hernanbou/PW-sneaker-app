import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { User } from '../models/user.model';

type RegisterUserData = Omit<User, 'id' | 'password'> & { password: string };
type UpdateUserData = Omit<User, 'id' | 'password'>;

interface LoginResponse {
  token: string;
  tokenType: string;
  user: User;
}

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string> | null;
}

interface ServiceResult {
  success: boolean;
  message: string;
}

interface UpdateResult extends ServiceResult {
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readCurrentUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  register(userData: RegisterUserData): Observable<ServiceResult> {
    const payload = this.normalizeRegisterPayload(userData);

    return this.http.post<User>(`${API_BASE_URL}/auth/register`, payload).pipe(
      map(() => ({
        success: true,
        message: 'Cadastro realizado com sucesso.'
      })),
      catchError((error) =>
        of({
          success: false,
          message: this.getErrorMessage(error, 'Nao foi possivel cadastrar o usuario.')
        })
      )
    );
  }

  login(email: string, password: string): Observable<ServiceResult> {
    const payload = {
      email: email.trim().toLowerCase(),
      password
    };

    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      tap((response) => {
        localStorage.setItem(STORAGE_KEYS.authToken, response.token);
        this.persistCurrentUser(response.user);
      }),
      map(() => ({
        success: true,
        message: 'Login realizado com sucesso.'
      })),
      catchError((error) =>
        of({
          success: false,
          message: this.getErrorMessage(error, 'E-mail ou senha invalidos.')
        })
      )
    );
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.readToken()) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.http.get<User>(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((user) => this.persistCurrentUser(user)),
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.logout();
        }

        return of(null);
      })
    );
  }

  updateCurrentUser(userData: UpdateUserData): Observable<UpdateResult> {
    if (!this.readToken()) {
      return of({
        success: false,
        message: 'Nenhum usuario logado.'
      });
    }

    const payload = this.normalizeUpdatePayload(userData);

    return this.http.put<User>(`${API_BASE_URL}/users/me`, payload, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((user) => this.persistCurrentUser(user)),
      map((user) => ({
        success: true,
        message: 'Dados atualizados com sucesso.',
        user
      })),
      catchError((error) =>
        of({
          success: false,
          message: this.getErrorMessage(error, 'Nao foi possivel atualizar seus dados.')
        })
      )
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.hasSessionToken();
  }

  hasSessionToken(): boolean {
    return !!this.readToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.readToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private normalizeRegisterPayload(userData: RegisterUserData): RegisterUserData {
    return {
      fullName: userData.fullName.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      cpf: userData.cpf.replace(/\D/g, ''),
      phone: userData.phone.replace(/\D/g, ''),
      cep: userData.cep.replace(/\D/g, ''),
      address: userData.address.trim(),
      number: userData.number.trim(),
      complement: userData.complement.trim(),
      city: userData.city.trim(),
      state: userData.state.trim().toUpperCase()
    };
  }

  private normalizeUpdatePayload(userData: UpdateUserData): UpdateUserData {
    return {
      fullName: userData.fullName.trim(),
      email: userData.email.trim().toLowerCase(),
      cpf: userData.cpf.replace(/\D/g, ''),
      phone: userData.phone.replace(/\D/g, ''),
      cep: userData.cep.replace(/\D/g, ''),
      address: userData.address.trim(),
      number: userData.number.trim(),
      complement: userData.complement.trim(),
      city: userData.city.trim(),
      state: userData.state.trim().toUpperCase()
    };
  }

  private persistCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readCurrentUser(): User | null {
    if (!this.readToken()) {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      return null;
    }

    const storedUser = localStorage.getItem(STORAGE_KEYS.currentUser);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      return null;
    }
  }

  private readToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.authToken);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 0) {
      return 'Nao foi possivel conectar ao backend.';
    }

    const body = error.error as ApiErrorBody | string | undefined;

    if (typeof body === 'string') {
      return body.trim() || fallback;
    }

    if (body?.fields) {
      const firstFieldMessage = Object.values(body.fields)[0];

      if (firstFieldMessage) {
        return firstFieldMessage;
      }
    }

    return body?.message || fallback;
  }
}
