import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { SearchService } from '../../core/services/search';
import { UserService } from '../../core/services/user';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})

export class NavbarComponent {
  readonly searchForm;

  currentUserLabel = 'Conta';
  isMobileMenuOpen = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly searchService: SearchService,
    private readonly userService: UserService
  ) {
    this.searchForm = this.formBuilder.nonNullable.group({
      term: ['']
    });

    this.searchForm.controls.term.setValue(this.searchService.getCurrentTerm());

    this.userService.currentUser$.subscribe((user) => {
      this.currentUserLabel = user ? user.fullName.split(' ')[0] : 'Conta';
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isMobileMenuOpen = false;
      });
  }

  submitSearch(): void {
    const { term } = this.searchForm.getRawValue();
    this.searchService.setTerm(term);
    this.isMobileMenuOpen = false;
    this.router.navigate(['/home']);
  }

  goToHome(): void {
    this.isMobileMenuOpen = false;
    this.router.navigate(['/home']);
  }

  goToCart(): void {
    this.isMobileMenuOpen = false;
    this.router.navigate(['/cart']);
  }

  goToUser(): void {
    this.isMobileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
};
