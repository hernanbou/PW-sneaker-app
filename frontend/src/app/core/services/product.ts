import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  private readonly readySubject = new BehaviorSubject<boolean>(false);
  readonly ready$ = this.readySubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  initializeProducts(forceRefresh = false): Observable<Product[]> {
    if (this.readySubject.value && !forceRefresh) {
      return of(this.productsSubject.value);
    }

    return this.http.get<Product[]>(`${API_BASE_URL}/products`).pipe(
      tap((products) => {
        this.productsSubject.next(products);
        this.readySubject.next(true);
      }),
      catchError((error) => {
        console.error('Erro ao carregar produtos do backend:', error);
        this.productsSubject.next([]);
        this.readySubject.next(true);
        return of([]);
      })
    );
  }

  refreshProducts(): Observable<Product[]> {
    return this.initializeProducts(true);
  }

  getProductById(id: number): Observable<Product | undefined> {
    if (!this.readySubject.value) {
      return this.initializeProducts().pipe(
        map((products) => products.find((product) => product.id === id))
      );
    }

    const cachedProduct = this.productsSubject.value.find((product) => product.id === id);

    if (cachedProduct) {
      return of(cachedProduct);
    }

    return this.http.get<Product>(`${API_BASE_URL}/products/${id}`).pipe(
      tap((product) => this.upsertProduct(product)),
      catchError(() => of(undefined))
    );
  }

  getCurrentProducts(): Product[] {
    return this.productsSubject.value;
  }

  private upsertProduct(product: Product): void {
    const products = this.productsSubject.value;
    const productIndex = products.findIndex((currentProduct) => currentProduct.id === product.id);

    if (productIndex === -1) {
      this.productsSubject.next([...products, product]);
      return;
    }

    const updatedProducts = [...products];
    updatedProducts[productIndex] = product;
    this.productsSubject.next(updatedProducts);
  }
}
