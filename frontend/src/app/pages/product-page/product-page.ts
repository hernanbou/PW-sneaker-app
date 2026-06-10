import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart';
import { ProductService } from '../../core/services/product';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-page.html',
  styleUrls: ['./product-page.css']
})
export class ProductPage {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly ready$ = this.productService.ready$;

  readonly product$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    switchMap((id) => this.productService.getProductById(id)),
    tap(() => {
      this.selectedSize = null;
      this.message = '';
      this.messageType = '';
    })
  );

  selectedSize: number | null = null;
  message = '';
  messageType: 'success' | 'danger' | '' = '';

  selectSize(size: number): void {
    this.selectedSize = size;
    this.message = '';
    this.messageType = '';
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, this.selectedSize).subscribe((result) => {
      this.message = result.message;
      this.messageType = result.success ? 'success' : 'danger';

      if (result.success) {
        this.productService.refreshProducts().subscribe();
        this.router.navigate(['/cart']);
      }
    });
  }

  goBackHome(): void {
    this.router.navigate(['/home']);
  }
}
