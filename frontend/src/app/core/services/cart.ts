import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { UserService } from './user';

interface CartItemResponse {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  selectedSize: number;
  quantity: number;
  lineTotal: number;
}

interface CartResponse {
  id: number;
  items: CartItemResponse[];
  itemCount: number;
  subtotal: number;
}

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string> | null;
}

interface CartActionResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cartSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cart$ = this.cartSubject.asObservable();

  readonly total$ = this.cart$.pipe(
    map((items) =>
      items.reduce((total, item) => total + item.price * item.quantity, 0)
    )
  );

  constructor(
    private readonly http: HttpClient,
    private readonly userService: UserService
  ) {}

  loadCart(): Observable<CartItem[]> {
    if (!this.userService.hasSessionToken()) {
      this.cartSubject.next([]);
      return of([]);
    }

    return this.http.get<CartResponse>(`${API_BASE_URL}/cart`, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      map((response) => this.mapCartItems(response)),
      tap((items) => this.cartSubject.next(items)),
      catchError((error) => {
        this.handleUnauthorized(error);
        this.cartSubject.next([]);
        return of([]);
      })
    );
  }

  addToCart(
    product: Product,
    selectedSize: number | null
  ): Observable<CartActionResult> {
    if (!selectedSize) {
      return of({
        success: false,
        message: 'Selecione um tamanho antes de adicionar ao carrinho.'
      });
    }

    if (!this.userService.hasSessionToken()) {
      return of({
        success: false,
        message: 'Faca login para adicionar produtos ao carrinho.'
      });
    }

    if (product.stock <= 0) {
      return of({
        success: false,
        message: 'Produto nao esta disponivel em estoque.'
      });
    }

    return this.http.post<CartResponse>(`${API_BASE_URL}/cart/items`, {
      productId: product.id,
      selectedSize,
      quantity: 1
    }, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      tap((response) => this.cartSubject.next(this.mapCartItems(response))),
      map(() => ({
        success: true,
        message: 'Produto adicionado ao carrinho.'
      })),
      catchError((error) => {
        this.handleUnauthorized(error);
        return of({
          success: false,
          message: this.getErrorMessage(error, 'Nao foi possivel adicionar o produto.')
        });
      })
    );
  }

  removeItem(itemId: number): Observable<void> {
    if (!this.userService.hasSessionToken()) {
      this.cartSubject.next([]);
      return of(undefined);
    }

    return this.http.delete<CartResponse>(`${API_BASE_URL}/cart/items/${itemId}`, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      tap((response) => this.cartSubject.next(this.mapCartItems(response))),
      map(() => undefined),
      catchError((error) => {
        this.handleUnauthorized(error);
        return of(undefined);
      })
    );
  }

  clearCart(): Observable<void> {
    if (!this.userService.hasSessionToken()) {
      this.cartSubject.next([]);
      return of(undefined);
    }

    return this.http.delete<CartResponse>(`${API_BASE_URL}/cart`, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      tap((response) => this.cartSubject.next(this.mapCartItems(response))),
      map(() => undefined),
      catchError((error) => {
        this.handleUnauthorized(error);
        return of(undefined);
      })
    );
  }

  finishCheckout(): void {
    this.cartSubject.next([]);
  }

  getCurrentCart(): CartItem[] {
    return this.cartSubject.value;
  }

  getCurrentTotal(): number {
    return this.cartSubject.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  private mapCartItems(response: CartResponse): CartItem[] {
    return response.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      selectedSize: item.selectedSize,
      quantity: item.quantity
    }));
  }

  private handleUnauthorized(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.userService.logout();
    }
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
