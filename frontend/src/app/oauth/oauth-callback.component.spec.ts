import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { OAuthCallbackComponent } from './oauth-callback.component';
import { AuthService } from '../services/auth.service';

describe('OAuthCallbackComponent', () => {
  let component: OAuthCallbackComponent;
  let fixture: ComponentFixture<OAuthCallbackComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getProfile', 'setAuthData']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      declarations: [OAuthCallbackComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OAuthCallbackComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard on successful authentication', () => {
    const mockAuthResponse = {
      user: { userId: '1', email: 'test@example.com', fullName: 'Test User', authProvider: 'google' as const },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    };

    authService.getProfile.and.returnValue(of(mockAuthResponse));

    component.ngOnInit();

    expect(authService.getProfile).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect to auth page with error on authentication failure', () => {
    authService.getProfile.and.returnValue(throwError(() => new Error('Authentication failed')));

    component.ngOnInit();

    expect(authService.getProfile).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], {
      queryParams: { error: 'Authentication error' }
    });
  });
});