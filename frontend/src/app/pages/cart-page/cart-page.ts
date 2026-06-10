import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CartService } from '../../core/services/cart';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css']
})
export class CartPage implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly cart$ = this.cartService.cart$;
  readonly total$ = this.cartService.total$;

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId).subscribe();
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe();
  }

  continueShopping(): void {
    this.router.navigate(['/home']);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
