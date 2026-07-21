import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, shareReplay, tap } from "rxjs";
import { UserDetail } from "../../shared/models/user-detail";
import { UserService } from "../../user-profile/services/user.service";

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly currentUserSubject = new BehaviorSubject<UserDetail | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly userService: UserService) {}

  loadUser(): Observable<UserDetail> {
    return this.userService.getUser().pipe(
      tap(user => this.currentUserSubject.next(user)),
      shareReplay(1)
    );
  }

  updateUser(body: Partial<UserDetail>): Observable<UserDetail> {
    return this.userService.updateUserDate(body).pipe(
      tap(updatedUser => this.currentUserSubject.next(updatedUser))
    );
  }

  getUserSnapshot(): UserDetail | null {
    return this.currentUserSubject.getValue();
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
  }
}