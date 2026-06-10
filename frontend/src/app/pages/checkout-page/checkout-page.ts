import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { OrderPayment } from '../../core/models/order.model';
import { User } from '../../core/models/user.model';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { UserService } from '../../core/services/user';

type PaymentMethod = OrderPayment['method'];

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-page.html',
  styleUrls: ['./checkout-page.css']
})
export class CheckoutPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly cart$ = this.cartService.cart$;
  readonly subtotal$ = this.cartService.total$;
  readonly paymentOptions: Array<{ method: PaymentMethod; label: string; discount: string }> = [
    {
      method: 'credit-card',
      label: 'Cartao de credito',
      discount: '5% ate 3x'
    },
    {
      method: 'pix',
      label: 'Pix',
      discount: '15%'
    },
    {
      method: 'boleto',
      label: 'Boleto',
      discount: '10%'
    }
  ];
  readonly installmentOptions = Array.from({ length: 10 }, (_, index) => index + 1);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
    address: ['', [Validators.required]],
    number: ['', [Validators.required]],
    complement: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    paymentMethod: ['credit-card' as PaymentMethod, [Validators.required]],
    installments: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    cardNumber: [''],
    cardName: [''],
    cardCpf: [''],
    cardCvv: [''],
    cardExpiration: ['']
  });

  currentUser: User | null = null;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  placedOrderId = '';

  ngOnInit(): void {
    if (!this.userService.hasSessionToken()) {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' }
      });
      return;
    }

    const user = this.userService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' }
      });
      return;
    }

    this.currentUser = user;
    this.checkoutForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      cep: user.cep,
      address: user.address,
      number: user.number,
      complement: user.complement,
      city: user.city,
      state: user.state
    });

    this.configurePaymentControls(this.checkoutForm.controls.paymentMethod.value);
    this.cartService.loadCart().subscribe();

    this.checkoutForm.controls.paymentMethod.valueChanges.subscribe((method) => {
      this.configurePaymentControls(method);
    });
  }

  submitOrder(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    const user = this.currentUser;

    if (!user) {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' }
      });
      return;
    }

    const items = this.cartService.getCurrentCart();

    if (items.length === 0) {
      this.errorMessage = 'Seu carrinho esta vazio.';
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.errorMessage = 'Revise os dados destacados antes de confirmar o pedido.';
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    this.orderService.checkout({
        method: formValue.paymentMethod,
        installments: this.isCreditCardSelected() ? Number(formValue.installments) : 1
    }, {
      cep: formValue.cep.replace(/\D/g, ''),
      address: formValue.address.trim(),
      number: formValue.number.trim(),
      complement: formValue.complement.trim(),
      city: formValue.city.trim(),
      state: formValue.state.trim().toUpperCase()
    }, {
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim().toLowerCase(),
      phone: formValue.phone.replace(/\D/g, '')
    }).subscribe({
      next: (order) => {
        this.cartService.finishCheckout();
        this.placedOrderId = String(order.id);
        this.successMessage = 'Pedido finalizado com sucesso.';
        this.checkoutForm.disable();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      }
    });
  }

  selectPayment(method: PaymentMethod): void {
    this.checkoutForm.controls.paymentMethod.setValue(method);
  }

  isPaymentSelected(method: PaymentMethod): boolean {
    return this.checkoutForm.controls.paymentMethod.value === method;
  }

  isCreditCardSelected(): boolean {
    return this.isPaymentSelected('credit-card');
  }

  getSelectedPaymentLabel(): string {
    const method = this.checkoutForm.controls.paymentMethod.value;
    const installments = this.checkoutForm.controls.installments.value;

    if (method === 'pix') {
      return 'Pix selecionado: 15% de desconto aplicado.';
    }

    if (method === 'boleto') {
      return 'Boleto selecionado: 10% de desconto aplicado.';
    }

    if (installments <= 3) {
      return 'Cartao selecionado: 5% de desconto para pagamento em ate 3x.';
    }

    return 'Cartao selecionado: parcelamento acima de 3x sem desconto.';
  }

  hasError(controlName: string, errorName?: string): boolean {
    const control = this.checkoutForm.get(controlName);

    if (!control) {
      return false;
    }

    if (!this.submitted && !control.touched) {
      return false;
    }

    return errorName ? control.hasError(errorName) : control.invalid;
  }

  calculateShipping(subtotal: number): number {
    if (subtotal <= 0 || subtotal >= 600) {
      return 0;
    }

    return 29.9;
  }

  calculateDiscount(subtotal: number): number {
    return subtotal * (this.getDiscountPercentage() / 100);
  }

  calculateFinalTotal(subtotal: number): number {
    return subtotal - this.calculateDiscount(subtotal) + this.calculateShipping(subtotal);
  }

  getDiscountPercentage(): number {
    const method = this.checkoutForm.controls.paymentMethod.value;

    if (method === 'pix') {
      return 15;
    }

    if (method === 'boleto') {
      return 10;
    }

    if (this.checkoutForm.controls.installments.value <= 3) {
      return 5;
    }

    return 0;
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToUser(): void {
    this.router.navigate(['/user']);
  }

  private configurePaymentControls(method: PaymentMethod): void {
    const installmentsControl = this.checkoutForm.controls.installments;
    const cardNumberControl = this.checkoutForm.controls.cardNumber;
    const cardNameControl = this.checkoutForm.controls.cardName;
    const cardCpfControl = this.checkoutForm.controls.cardCpf;
    const cardCvvControl = this.checkoutForm.controls.cardCvv;
    const cardExpirationControl = this.checkoutForm.controls.cardExpiration;

    if (method !== 'credit-card') {
      installmentsControl.setValue(1);
      installmentsControl.disable();
      cardNumberControl.clearValidators();
      cardNameControl.clearValidators();
      cardCpfControl.clearValidators();
      cardCvvControl.clearValidators();
      cardExpirationControl.clearValidators();
      cardNumberControl.setValue('');
      cardNameControl.setValue('');
      cardCpfControl.setValue('');
      cardCvvControl.setValue('');
      cardExpirationControl.setValue('');
    } else {
      installmentsControl.enable();
      cardNumberControl.setValidators([
        Validators.required,
        Validators.pattern(/^[\d -]{13,25}$/)
      ]);
      cardNameControl.setValidators([Validators.required, Validators.minLength(5)]);
      cardCpfControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
      ]);
      cardCvvControl.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3,4}$/)
      ]);
      cardExpirationControl.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
      ]);
    }

    installmentsControl.updateValueAndValidity();
    cardNumberControl.updateValueAndValidity();
    cardNameControl.updateValueAndValidity();
    cardCpfControl.updateValueAndValidity();
    cardCvvControl.updateValueAndValidity();
    cardExpirationControl.updateValueAndValidity();
  }
}
