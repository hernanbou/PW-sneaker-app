import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, map, of, tap } from 'rxjs';

import { Product } from '../models/product.model';
import { STORAGE_KEYS } from '../constants/storage-keys';

const PRODUCT_CATALOG_VERSION = '2026-04-08-v2';

@Injectable({
  providedIn: 'root',
})

export class ProductService {
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  private readonly readySubject = new BehaviorSubject<boolean>(false);
  readonly ready$ = this.readySubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  initializeProducts(): Observable<Product[]> {
    if (this.readySubject.value) {
      return of(this.productsSubject.value);
    }

    const storedCatalogVersion = localStorage.getItem(STORAGE_KEYS.productsVersion);
    const canUseStoredProducts = storedCatalogVersion === PRODUCT_CATALOG_VERSION;

    if (!canUseStoredProducts) {
      localStorage.removeItem(STORAGE_KEYS.products);
      localStorage.removeItem(STORAGE_KEYS.cart);
      localStorage.setItem(STORAGE_KEYS.productsVersion, PRODUCT_CATALOG_VERSION);
    }

    const storedProducts = localStorage.getItem(STORAGE_KEYS.products);

    if (storedProducts && canUseStoredProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts) as Product[];
        this.productsSubject.next(parsedProducts);
        this.readySubject.next(true);
        return of(parsedProducts);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.products);
      }
    }

    return this.http.get<Product[]>('/data/products.json').pipe(
      tap((products) => {
        this.persistProducts(products);
        localStorage.setItem(STORAGE_KEYS.productsVersion, PRODUCT_CATALOG_VERSION);
        this.readySubject.next(true);
      }),
      catchError((error) => {
        console.error('Erro ao carregar produtos iniciais:', error);
        this.readySubject.next(true);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.products$.pipe(
      map((products) => products.find((product) => product.id === id))
    );
  }

  getCurrentProducts(): Product[] {
    return this.productsSubject.value;
  }

  decreaseStock(productId: number, amount: number = 1): boolean {
    const products = [...this.productsSubject.value];
    const productIndex = products.findIndex((product) => product.id === productId);

    if (productIndex === -1) {
      return false;
    }

    const currentProduct = products[productIndex];

    if (currentProduct.stock < amount) {
      return false;
    }

    products[productIndex] = {
      ...currentProduct,
      stock: currentProduct.stock - amount
    };

    this.persistProducts(products);
    return true;
  }

  increaseStock(productId: number, amount: number = 1): void {
    const products = [...this.productsSubject.value];
    const productIndex = products.findIndex((product) => product.id === productId);

    if (productIndex === -1) {
      return;
    }

    const currentProduct = products[productIndex];

    products[productIndex] = {
      ...currentProduct,
      stock: currentProduct.stock + amount
    };

    this.persistProducts(products);
  }

  private persistProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    this.productsSubject.next(products);
  }
};
