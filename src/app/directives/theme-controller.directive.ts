import { DOCUMENT } from '@angular/common';
import { Directive, Inject, OnDestroy, Renderer2 } from '@angular/core';
import { WINDOW } from '@app/declarations/constants/tokens/window.token';
import { Theme, ThemeService } from '@bimeister/pupakit.common';
import { fromEvent, Subscription } from 'rxjs';

const COLOR_NEUTRAL_1000: string = '#1c1d22';
const COLOR_NEUTRAL_1: string = '#ffffff';

@Directive({
  selector: '[appThemeSync]',
  standalone: true,
})
export class ThemeSyncDirective implements OnDestroy {
  private readonly subscription: Subscription = new Subscription();

  constructor(
    private readonly themeService: ThemeService,
    @Inject(WINDOW) private readonly window: Window,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly renderer: Renderer2
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
    const preferredTheme: Theme = this.getPreferredTheme();
    this.themeService.setTheme(preferredTheme);
    this.setBrowserToolbarTheme(preferredTheme);
  }

  private getPreferredTheme(): Theme {
    if (Object.hasOwn(this.window, 'mathMedia')) {
      return Theme.Light;
    }

    const isDark: boolean = this.window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    return isDark ? Theme.Dark : Theme.Light;
  }

  private setBrowserToolbarTheme(theme: Theme): void {
    const themeColor: HTMLMetaElement | null = this.document.head.querySelector(
      'meta[name=theme-color]'
    );

    const color: string =
      theme === Theme.Light ? COLOR_NEUTRAL_1 : COLOR_NEUTRAL_1000;

    this.renderer.setAttribute(themeColor, 'content', color);
  }
}
