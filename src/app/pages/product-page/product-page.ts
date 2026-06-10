import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';

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

  addToCart(productIdData: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    sizes: number[];
  }): void {
    const result = this.cartService.addToCart(productIdData, this.selectedSize);

    this.message = result.message;
    this.messageType = result.success ? 'success' : 'danger';

    if (result.success) {
      this.router.navigate(['/cart']);
    }
  }

  goBackHome(): void {
    this.router.navigate(['/home']);
  }
}
