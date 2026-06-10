import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Order } from '../../core/models/order.model';
import { User } from '../../core/models/user.model';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { UserService } from '../../core/services/user';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-page.html',
  styleUrls: ['./user-page.css']
})
export class UserPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)]],
    cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    address: ['', [Validators.required]],
    number: ['', [Validators.required]],
    complement: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]]
  });

  currentUser: User | null = null;
  orders: Order[] = [];
  cartItemCount = 0;
  isEditing = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (!this.userService.hasSessionToken()) {
      this.redirectToLogin();
      return;
    }

    const cachedUser = this.userService.getCurrentUser();

    if (cachedUser) {
      this.currentUser = cachedUser;
      this.patchProfileForm(cachedUser);
    }

    this.userService.loadCurrentUser().subscribe((freshUser) => {
      if (!freshUser) {
        this.redirectToLogin();
        return;
      }
  
      this.currentUser = freshUser;
      this.patchProfileForm(freshUser);
      this.changeDetector.markForCheck();
      this.loadAccountData();
    });
  }

  private loadAccountData(): void {
    this.orderService.loadMyOrders().subscribe((orders) => {
      this.orders = orders;
      this.changeDetector.markForCheck();
    });

    this.cartService.loadCart().subscribe((items) => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
      this.changeDetector.markForCheck();
    });
  }

  private redirectToLogin(): void {
    this.userService.logout();
    this.router.navigate(['/login'], {
      queryParams: { redirectTo: '/user' }
    });
  }

  startEditing(): void {
    if (!this.currentUser) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitted = false;
    this.patchProfileForm(this.currentUser);
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.currentUser) {
      this.patchProfileForm(this.currentUser);
    }

    this.errorMessage = '';
    this.submitted = false;
    this.isEditing = false;
  }

  saveProfile(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();
    this.userService.updateCurrentUser({
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim().toLowerCase(),
      cpf: formValue.cpf.replace(/\D/g, ''),
      phone: formValue.phone.replace(/\D/g, ''),
      cep: formValue.cep.replace(/\D/g, ''),
      address: formValue.address.trim(),
      number: formValue.number.trim(),
      complement: formValue.complement.trim(),
      city: formValue.city.trim(),
      state: formValue.state.trim().toUpperCase()
    }).subscribe((result) => {
      if (!result.success || !result.user) {
        this.errorMessage = result.message;
        this.changeDetector.markForCheck();
        return;
      }

      this.currentUser = result.user;
      this.patchProfileForm(result.user);
      this.isEditing = false;
      this.submitted = false;
      this.successMessage = result.message;
      this.changeDetector.markForCheck();
    });
  }

  hasError(controlName: string, errorName?: string): boolean {
    const control = this.profileForm.get(controlName);

    if (!control) {
      return false;
    }

    if (!this.submitted && !control.touched) {
      return false;
    }

    return errorName ? control.hasError(errorName) : control.invalid;
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  formatCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) {
      return cpf;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return phone;
  }

  formatCep(cep: string): string {
    const digits = cep.replace(/\D/g, '');

    if (digits.length !== 8) {
      return cep;
    }

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getPaymentLabel(order: Order): string {
    if (!order.payment) {
      return 'Pagamento nao informado';
    }

    if (order.payment.method === 'pix') {
      return 'Pix';
    }

    if (order.payment.method === 'boleto') {
      return 'Boleto';
    }

    return 'Cartao de credito';
  }

  getPaymentSummary(order: Order): string {
    if (!order.payment) {
      return 'Metodo nao informado';
    }

    if (order.payment.method === 'credit-card') {
      return `${this.getPaymentLabel(order)} - ${order.payment.installments}x`;
    }

    return `${this.getPaymentLabel(order)} - a vista`;
  }

  private patchProfileForm(user: User): void {
    this.profileForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      cep: user.cep,
      address: user.address,
      number: user.number,
      complement: user.complement,
      city: user.city,
      state: user.state
    });
  }
}
