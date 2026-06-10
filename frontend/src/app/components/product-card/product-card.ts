import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  constructor(private readonly router: Router) {}

  goToProduct(): void {
    this.router.navigate(['/product', this.product.id]);
  }
}