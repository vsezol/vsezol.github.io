import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  ClientUiStateHandlerService,
  Theme,
  ThemeService,
} from '@bimeister/pupakit.common';
import { PupaThemeWrapperModule } from '@bimeister/pupakit.kit';
import { Observable } from 'rxjs';
import { ThemeSyncDirective } from './directives/theme-sync.directive';
import { WelcomePageComponent } from './pages/welcome-page/welcome-page.component';
import { NonNullablePipe } from './shared/pipes/non-nullable.pipe';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PupaThemeWrapperModule,
    NonNullablePipe,
    WelcomePageComponent,
    AsyncPipe,
    ThemeSyncDirective,
  ],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('iframe', { static: true })
  private readonly iframeElementRef: ElementRef<HTMLIFrameElement> | undefined;

  public readonly theme: typeof Theme = Theme;

  public readonly theme$: Observable<Theme> = this.themeService.theme$;

  constructor(
    private readonly clientUiStateHandlerService: ClientUiStateHandlerService,
    private readonly themeService: ThemeService
  ) {}

  public ngAfterViewInit(): void {
    this.clientUiStateHandlerService.setIframeElement(
      this.iframeElementRef?.nativeElement
    );
  }
}
