import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { NavbarComponent } from './components/navbar/navbar';
import { ProductService } from './core/services/product';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showNavbar: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly productService:  ProductService
  ) {}

  ngOnInit(): void {
    this.updateNavbarVisibility(this.router.url);

    this.router.events
      .pipe(filter((event) : event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateNavbarVisibility(event.urlAfterRedirects);
      });
    
    this.productService.initializeProducts().subscribe();
  };

  private updateNavbarVisibility(url: string): void {
    this.showNavbar = !url.startsWith('/login');
  };
};