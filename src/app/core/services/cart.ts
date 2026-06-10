import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

import { STORAGE_KEYS } from '../constants/storage-keys';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { ProductService } from './product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cartSubject = new BehaviorSubject<CartItem[]>(this.readCart());
  readonly cart$ = this.cartSubject.asObservable();

  readonly total$ = this.cart$.pipe(
    map((items) =>
      items.reduce((total, item) => total + item.price * item.quantity, 0)
    )
  );

  constructor(private readonly productService: ProductService) {}

  addToCart(
    product: Product,
    selectedSize: number | null
  ): { success: boolean; message: string } {
    if (!selectedSize) {
      return {
        success: false,
        message: 'Selecione um tamanho antes de adicionar ao carrinho.'
      };
    }

    if (product.stock <= 0) {
      return {
        success: false,
        message: 'Produto não está disponível em estoque.'
      };
    }

    const stockUpdated = this.productService.decreaseStock(product.id, 1);

    if (!stockUpdated) {
      return {
        success: false,
        message: 'Não foi possível adicionar. Estoque insuficiente.'
      };
    }

    const newItem: CartItem = {
      id: this.generateItemId(product.id),
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      selectedSize,
      quantity: 1
    };

    const updatedCart = [...this.cartSubject.value, newItem];
    this.persistCart(updatedCart);

    return {
      success: true,
      message: 'Produto adicionado ao carrinho.'
    };
  }

  removeItem(itemId: string): void {
    const currentCart = this.cartSubject.value;
    const itemToRemove = currentCart.find((item) => item.id === itemId);

    if (!itemToRemove) {
      return;
    }

    this.productService.increaseStock(itemToRemove.productId, itemToRemove.quantity);

    const updatedCart = currentCart.filter((item) => item.id !== itemId);
    this.persistCart(updatedCart);
  }

  clearCart(): void {
    for (const item of this.cartSubject.value) {
      this.productService.increaseStock(item.productId, item.quantity);
    }

    this.persistCart([]);
  }

  private persistCart(cart: CartItem[]): void {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  private readCart(): CartItem[] {
    const storedCart = localStorage.getItem(STORAGE_KEYS.cart);

    if (!storedCart) {
      return [];
    }

    try {
      return JSON.parse(storedCart) as CartItem[];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.cart);
      return [];
    }
  }

  private generateItemId(productId: number): string {
    if ('randomUUID' in crypto) {
      return `${productId}-${crypto.randomUUID()}`;
    }

    return `${productId}-${Date.now()}`;
  }
};