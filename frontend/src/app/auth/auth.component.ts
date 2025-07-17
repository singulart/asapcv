import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: false,
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ isLoginMode ? 'Welcome Back' : 'Create Account' }}</h1>
          <p>{{ isLoginMode ? 'Sign in to your ASAP CV account' : 'Join ASAP CV to start tailoring your resume' }}</p>
        </div>

        <!-- Google OAuth Button -->
        <button 
          type="button" 
          class="btn btn-google"
          (click)="signInWithGoogle()"
          [disabled]="isLoading">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ isLoginMode ? 'Sign in with Google' : 'Sign up with Google' }}
        </button>

        <div class="divider">
          <span>or</span>
        </div>

        <!-- Login/Register Form -->
        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Full Name (Register only) -->
          <div class="form-group" *ngIf="!isLoginMode">
            <label for="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              class="form-control"
              formControlName="fullName"
              placeholder="Enter your full name"
              [class.error]="authForm.get('fullName')?.invalid && authForm.get('fullName')?.touched">
            <div class="error-message" *ngIf="authForm.get('fullName')?.invalid && authForm.get('fullName')?.touched">
              <span *ngIf="authForm.get('fullName')?.errors?.['required']">Full name is required</span>
              <span *ngIf="authForm.get('fullName')?.errors?.['minlength']">Full name must be at least 2 characters</span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              class="form-control"
              formControlName="email"
              placeholder="Enter your email"
              [class.error]="authForm.get('email')?.invalid && authForm.get('email')?.touched">
            <div class="error-message" *ngIf="authForm.get('email')?.invalid && authForm.get('email')?.touched">
              <span *ngIf="authForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="authForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                class="form-control"
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="authForm.get('password')?.invalid && authForm.get('password')?.touched">
              <button
                type="button"
                class="password-toggle"
                (click)="togglePassword()"
                tabindex="-1">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div class="error-message" *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched">
              <span *ngIf="authForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="authForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters</span>
            </div>
          </div>

          <!-- Confirm Password (Register only) -->
          <div class="form-group" *ngIf="!isLoginMode">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              class="form-control"
              formControlName="confirmPassword"
              placeholder="Confirm your password"
              [class.error]="authForm.get('confirmPassword')?.invalid && authForm.get('confirmPassword')?.touched">
            <div class="error-message" *ngIf="authForm.get('confirmPassword')?.invalid && authForm.get('confirmPassword')?.touched">
              <span *ngIf="authForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
              <span *ngIf="authForm.get('confirmPassword')?.errors?.['passwordMismatch']">Passwords do not match</span>
            </div>
          </div>

          <!-- Error Message -->
          <div class="alert alert-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="authForm.invalid || isLoading">
            <span *ngIf="isLoading" class="spinner"></span>
            {{ isLoading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account') }}
          </button>
        </form>

        <!-- Mode Toggle -->
        <div class="auth-footer">
          <p>
            {{ isLoginMode ? "Don't have an account?" : 'Already have an account?' }}
            <button type="button" class="link-button" (click)="toggleMode()">
              {{ isLoginMode ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .auth-card {
        width: 100%;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 2rem;
      }

      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .auth-header h1 {
        color: #333;
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
        font-weight: 600;
      }

      .auth-header p {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .btn-google {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border: 2px solid #e0e0e0;
        background: white;
        color: #333;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s ease;
        margin-bottom: 1.5rem;
      }

      .btn-google:hover:not(:disabled) {
        border-color: #d0d0d0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .btn-google:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .google-icon {
        width: 20px;
        height: 20px;
      }

      .divider {
        text-align: center;
        margin: 1.5rem 0;
        position: relative;
      }

      .divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e0e0e0;
      }

      .divider span {
        background: white;
        padding: 0 1rem;
        color: #666;
        font-size: 0.875rem;
      }

      .form-group {
        margin-bottom: 1.25rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 500;
        font-size: 0.875rem;
      }

      .form-control {
        width: 100%;
        padding: 0.875rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
      }

      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }

      .form-control.error {
        border-color: #e74c3c;
      }

      .password-input {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        right: 0.875rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        opacity: 0.6;
        transition: opacity 0.2s ease;
      }

      .password-toggle:hover {
        opacity: 1;
      }

      .error-message {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #e74c3c;
      }

      .alert {
        padding: 0.875rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }

      .alert-error {
        background: #ffeaea;
        color: #c62828;
        border: 1px solid #ffcdd2;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .btn-full {
        width: 100%;
        padding: 1rem;
        border-radius: 8px;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .auth-footer {
        text-align: center;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e0e0e0;
      }

      .auth-footer p {
        color: #666;
        font-size: 0.875rem;
      }

      .link-button {
        background: none;
        border: none;
        color: #667eea;
        cursor: pointer;
        font-weight: 500;
        text-decoration: underline;
        font-size: inherit;
      }

      .link-button:hover {
        color: #5a6fd8;
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .auth-container {
          padding: 0.5rem;
        }

        .auth-card {
          padding: 1.5rem;
        }

        .auth-header h1 {
          font-size: 1.5rem;
        }

        .form-control {
          padding: 0.75rem;
        }

        .btn-full {
          padding: 0.875rem;
        }
      }
    `,
  ],
})
export class AuthComponent implements OnInit {
  authForm: FormGroup;
  isLoginMode = true;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.createForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.authForm.reset();
    
    // Update form validators based on mode
    const fullNameControl = this.authForm.get('fullName');
    const confirmPasswordControl = this.authForm.get('confirmPassword');
    
    if (this.isLoginMode) {
      fullNameControl?.clearValidators();
      confirmPasswordControl?.clearValidators();
    } else {
      fullNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      confirmPasswordControl?.setValidators([Validators.required]);
    }
    
    fullNameControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.authForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.authForm.value;
    
    if (this.isLoginMode) {
      this.login(formValue.email, formValue.password);
    } else {
      this.register(formValue.fullName, formValue.email, formValue.password);
    }
  }

  private login(email: string, password: string): void {
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.authService.setAuthData(response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.handleAuthError(error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private register(fullName: string, email: string, password: string): void {
    this.authService.register({ fullName, email, password }).subscribe({
      next: (response) => {
        this.authService.setAuthData(response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.handleAuthError(error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  signInWithGoogle(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    window.location.href = `/api/auth/google`;
  }

  private handleAuthError(error: any): void {
    console.error('Authentication error:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.status === 409) {
      this.errorMessage = 'An account with this email already exists.';
    } else if (error.status === 400) {
      this.errorMessage = error.error?.message || 'Please check your input and try again.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again later.';
    }
  }
}