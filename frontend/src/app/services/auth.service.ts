import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  authProvider: 'local' | 'google';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  // Load current user from /me or /profile using secure cookie
  loadCurrentUser(): void {
    this.getProfile().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.logout()
    });
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(userData: { fullName: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData, { withCredentials: true }).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  // For Google login, handled by redirect flow — no need to implement this here anymore
  signInWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      error: (error) => console.error('Logout error:', error)
    });
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { withCredentials: true });
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData, { withCredentials: true }).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(error => {
        console.error('Profile update error:', error);
        throw error;
      })
    );
  }
}