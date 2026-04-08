import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';

import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductService } from '../../core/services/product';
import { SearchService } from '../../core/services/search';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePage {
  private readonly productService = inject(ProductService);
  private readonly searchService = inject(SearchService);

  readonly ready$ = this.productService.ready$;

  readonly filteredProducts$ = combineLatest([
    this.productService.products$,
    this.searchService.term$
  ]).pipe(
    map(([products, term]) => this.searchService.filterProducts(products, term))
  );
};
