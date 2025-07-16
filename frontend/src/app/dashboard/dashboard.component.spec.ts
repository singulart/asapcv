import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../services/auth.service';
import { CvService } from '../services/cv.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let cvService: jasmine.SpyObj<CvService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of({ userId: '1', email: 'test@example.com', fullName: 'Test User', authProvider: 'local' })
    });
    const cvServiceSpy = jasmine.createSpyObj('CvService', ['getCvVersions', 'downloadCv', 'deleteCv']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CvService, useValue: cvServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    cvService = TestBed.inject(CvService) as jasmine.SpyObj<CvService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    cvService.getCvVersions.and.returnValue(of([]));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load CV versions on init', () => {
    expect(cvService.getCvVersions).toHaveBeenCalled();
  });

  it('should navigate to upload when uploadNewCv is called', () => {
    component.uploadNewCv();
    expect(router.navigate).toHaveBeenCalledWith(['/cv/upload']);
  });

  it('should navigate to profile when navigateToProfile is called', () => {
    component.navigateToProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });
});