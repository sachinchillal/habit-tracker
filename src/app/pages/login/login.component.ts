import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Shown when a signed-out user opens a protected page. Sign-in itself happens in the
 * Domain SSO app; it sends the user back to the app root, where resumeAfterSignInGuard
 * continues to the page they asked for.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly logoSrc = 'addhuri-habit-tracker-logo.svg';
  readonly signInUrl = this.auth.signInUrl;
  readonly signUpUrl = this.auth.signUpUrl;

  ngOnInit(): void {
    this.auth.setPendingReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }
}
