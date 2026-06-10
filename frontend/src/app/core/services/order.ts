import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { CartItem } from '../models/cart-item.model';
import { Order, OrderAddress, OrderPayment } from '../models/order.model';
import { UserService } from './user';

type ApiPaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

interface ApiOrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  unitPrice: number;
  selectedSize: number;
  quantity: number;
  lineTotal: number;
}

interface ApiPayment {
  method: ApiPaymentMethod;
  installments: number;
}

interface ApiOrder {
  id: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: ApiOrderItem[];
  address: OrderAddress;
  payment: ApiPayment;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
}

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string> | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ordersSubject = new BehaviorSubject<Order[]>([]);
  readonly orders$ = this.ordersSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly userService: UserService
  ) {}

  loadMyOrders(): Observable<Order[]> {
    if (!this.userService.hasSessionToken()) {
      this.ordersSubject.next([]);
      return of([]);
    }

    return this.http.get<ApiOrder[]>(`${API_BASE_URL}/orders/me`, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      map((orders) => orders.map((order) => this.mapOrder(order))),
      tap((orders) => this.ordersSubject.next(orders)),
      catchError((error) => {
        this.handleUnauthorized(error);
        this.ordersSubject.next([]);
        return of([]);
      })
    );
  }

  checkout(
    payment: OrderPayment,
    address: OrderAddress,
    customer: { fullName: string; email: string; phone: string }
  ): Observable<Order> {
    const payload = {
      paymentMethod: this.toApiPaymentMethod(payment.method),
      installments: payment.method === 'credit-card' ? payment.installments : 1,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      cep: address.cep,
      address: address.address,
      number: address.number,
      complement: address.complement,
      city: address.city,
      state: address.state
    };

    return this.http.post<ApiOrder>(`${API_BASE_URL}/checkout`, payload, {
      headers: this.userService.getAuthHeaders()
    }).pipe(
      map((order) => this.mapOrder(order)),
      tap((order) => this.ordersSubject.next([order, ...this.ordersSubject.value])),
      catchError((error) => {
        this.handleUnauthorized(error);
        return throwError(() => new Error(this.getErrorMessage(error, 'Nao foi possivel finalizar o pedido.')));
      })
    );
  }

  private mapOrder(order: ApiOrder): Order {
    return {
      id: order.id,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: order.items.map((item) => this.mapOrderItem(item)),
      address: order.address,
      payment: {
        method: this.fromApiPaymentMethod(order.payment.method),
        installments: order.payment.installments
      },
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      status: this.fromApiStatus(order.status),
      createdAt: order.createdAt
    };
  }

  private mapOrderItem(item: ApiOrderItem): CartItem {
    return {
      id: item.id,
      productId: item.productId,
      name: item.productName,
      image: item.productImage,
      price: item.unitPrice,
      selectedSize: item.selectedSize,
      quantity: item.quantity
    };
  }

  private toApiPaymentMethod(method: OrderPayment['method']): ApiPaymentMethod {
    if (method === 'pix') {
      return 'PIX';
    }

    if (method === 'boleto') {
      return 'BOLETO';
    }

    return 'CREDIT_CARD';
  }

  private fromApiPaymentMethod(method: ApiPaymentMethod): OrderPayment['method'] {
    if (method === 'PIX') {
      return 'pix';
    }

    if (method === 'BOLETO') {
      return 'boleto';
    }

    return 'credit-card';
  }

  private fromApiStatus(status: string): Order['status'] {
    if (status === 'EM_SEPARACAO') {
      return 'Em separacao';
    }

    if (status === 'ENVIADO') {
      return 'Enviado';
    }

    return 'Recebido';
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
