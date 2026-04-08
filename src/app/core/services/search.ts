import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly termSubject = new BehaviorSubject<string>('');
  readonly term$ = this.termSubject.asObservable();

  setTerm(term: string): void {
    this.termSubject.next(term.trim());
  };

  filterProducts(products: Product[], term: string): Product[] {
    const normalizedTerm = this.normalizeText(term);

    if (!normalizedTerm) {
      return products;
    }

    const tokens = normalizedTerm.split(/\s+/).filter(Boolean);

    return products.filter((product) => {
      const searchableContent = this.buildSearchableContent(product);

      return tokens.every((token) => searchableContent.includes(token));
    });
  }

  getCurrentTerm(): string {
    return this.termSubject.value;
  };

  clear(): void {
    this.termSubject.next('');
  };

  private buildSearchableContent(product: Product): string {
    const content = [
      product.name,
      product.description,
      product.model ?? '',
      ...(product.tags ?? []),
      ...(product.features ?? [])
    ].join(' ');

    return this.normalizeText(content);
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
};
