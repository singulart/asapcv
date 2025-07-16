import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AuthComponent } from './auth.component';
import { AuthService } from '../services/auth.service';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'register', 'signInWithGoogle', 'isAuthenticated', 'setAuthData'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    authService.isAuthenticated.and.returnValue(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize in login mode', () => {
    expect(component.isLoginMode).toBe(true);
  });

  it('should toggle between login and register modes', () => {
    expect(component.isLoginMode).toBe(true);
    component.toggleMode();
    expect(component.isLoginMode).toBe(false);
    component.toggleMode();
    expect(component.isLoginMode).toBe(true);
  });

  it('should validate required fields in login mode', () => {
    component.isLoginMode = true;
    component.toggleMode(); // This will set up the form for login mode
    component.toggleMode(); // Back to login mode to ensure proper setup
    
    const form = component.authForm;
    expect(form.valid).toBeFalsy();
    
    // Set valid email and password
    form.get('email')?.setValue('test@example.com');
    form.get('password')?.setValue('password123');
    
    // Clear validators for fields not needed in login mode
    form.get('fullName')?.clearValidators();
    form.get('confirmPassword')?.clearValidators();
    form.get('fullName')?.updateValueAndValidity();
    form.get('confirmPassword')?.updateValueAndValidity();
    
    expect(form.get('email')?.valid).toBeTruthy();
    expect(form.get('password')?.valid).toBeTruthy();
  });
});