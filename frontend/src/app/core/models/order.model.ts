import { CartItem } from './cart-item.model';

export interface OrderAddress {
  cep: string;
  address: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

export interface OrderPayment {
  method: 'credit-card' | 'pix' | 'boleto';
  installments: number;
}

export interface Order {
  id: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  address: OrderAddress;
  payment: OrderPayment;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'Recebido' | 'Em separacao' | 'Enviado';
  createdAt: string;
}
