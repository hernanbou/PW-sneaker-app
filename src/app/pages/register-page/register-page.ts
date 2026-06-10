import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { UserService } from '../../core/services/user';

const passwordMatchValidator: ValidatorFn = (
  formGroup: AbstractControl
): ValidationErrors | null => {
  const password = formGroup.get('password')?.value;
  const confirmPassword = formGroup.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-page.html',
  styleUrls: ['./register-page.css']
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      address: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]]
    },
    {
      validators: passwordMatchValidator
    }
  );

  submitted = false;
  errorMessage = '';

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();

    const result = this.userService.register({
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      cpf: formValue.cpf.replace(/\D/g, ''),
      phone: formValue.phone.replace(/\D/g, ''),
      cep: formValue.cep.replace(/\D/g, ''),
      address: formValue.address.trim(),
      number: formValue.number.trim(),
      complement: formValue.complement.trim(),
      city: formValue.city.trim(),
      state: formValue.state.trim().toUpperCase()
    });

    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: { registered: 1 }
    });
  }

  hasError(controlName: string, errorName?: string): boolean {
    const control = this.registerForm.get(controlName);

    if (!control) {
      return false;
    }

    if (!this.submitted && !control.touched) {
      return false;
    }

    return errorName ? control.hasError(errorName) : control.invalid;
  }

  hasPasswordMismatch(): boolean {
    return (this.submitted || this.registerForm.touched) &&
      this.registerForm.hasError('passwordMismatch');
  }
}
