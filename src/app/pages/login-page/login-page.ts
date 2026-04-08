import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { UserService } from '../../core/services/user';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css']
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitted = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage = 'Cadastro realizado com sucesso. Agora faça seu login.';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const result = this.userService.login(email, password);

    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    this.router.navigate(['/home']);
  }

  hasError(controlName: 'email' | 'password', errorName?: string): boolean {
    const control = this.loginForm.controls[controlName];

    if (!this.submitted && !control.touched) {
      return false;
    }

    return errorName ? control.hasError(errorName) : control.invalid;
  }
}
