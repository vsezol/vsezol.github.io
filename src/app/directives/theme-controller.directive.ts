import { Directive, Inject, OnDestroy } from '@angular/core';
import { WINDOW } from '@app/declarations/constants/tokens/window.token';
import { Theme, ThemeService } from '@bimeister/pupakit.common';
import { fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[appThemeSync]',
  standalone: true,
})
export class ThemeSyncDirective implements OnDestroy {
  private readonly subscription: Subscription = new Subscription();

  constructor(
    private readonly themeService: ThemeService,
    @Inject(WINDOW) private readonly window: Window
  ) {
    this.applyPreferredTheme();
    this.subscription.add(this.watchColorSchemeChange());
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private watchColorSchemeChange(): Subscription {
    return fromEvent(
      this.window?.matchMedia('(prefers-color-scheme: dark)'),
      'change'
    ).subscribe(() => {
      this.applyPreferredTheme();
    });
  }

  private applyPreferredTheme(): void {
    this.themeService.setTheme(this.getPreferredColorScheme());
  }

  private getPreferredColorScheme(): Theme {
    if (Object.hasOwn(this.window, 'mathMedia')) {
      return Theme.Light;
    }

    const isDark: boolean = this.window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    return isDark ? Theme.Dark : Theme.Light;
  }
}
