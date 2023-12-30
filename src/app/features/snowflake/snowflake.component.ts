import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { WINDOW } from '@app/declarations/constants/tokens/window.token';
import { Repeated, isNil } from '@bimeister/utilities';
import { Subject, debounceTime, filter, takeUntil, tap } from 'rxjs';

const MAX_CLICKS_COUNT: number = 5;
const SCALE_FACTOR: number = 5;
const ROTATION_FACTOR: number = 15;
const SNOWFLAKES_PER_WAVE: number = 150;
const WAVE_DELAY: number = 100;
const WAIT_TIME: number = 1500;
const ANIMATION_DELAY: number = 1000;

type Snowflake = [...Repeated<number, 3>, string];
type Wave = Snowflake[];

@Component({
  selector: 'app-snowflake',
  templateUrl: './snowflake.component.html',
  styleUrls: ['./snowflake.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SnowflakeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('element', { read: ElementRef })
  private readonly snowflakeElement: ElementRef | undefined;

  private readonly clicks$: Subject<void> = new Subject();

  private readonly destroy$: Subject<void> = new Subject();

  private clicksCount: number = 0;

  public get snowflakeScale(): number {
    return 1 + this.clicksCount / SCALE_FACTOR;
  }

  public get snowflakeRotation(): number {
    if (this.clicksCount === 0) {
      return 0;
    }

    const value: number = ROTATION_FACTOR * this.snowflakeScale;

    return this.clicksCount % 2 === 0 ? value : -value;
  }

  private snowflakeRect: DOMRect | undefined;

  private get startTop(): string {
    return `${this.snowflakeRect?.y}px`;
  }

  private get startLeft(): string {
    return `${this.snowflakeRect?.x}px`;
  }

  constructor(
    private readonly renderer: Renderer2,
    private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(WINDOW) private readonly window: Window,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  public ngAfterViewInit(): void {
    this.ejectSnowflakesByClicks();

    this.snowflakeRect =
      this.snowflakeElement?.nativeElement.getBoundingClientRect();
  }

  public ngOnDestroy(): void {
    this.clicks$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public handleClick(): void {
    this.clicks$.next();
  }

  public ejectSnowflakes(): void {
    this.spawnWaves(this.clicksCount);
    this.clicksCount = 0;
    this.changeDetectorRef.markForCheck();
  }

  private ejectSnowflakesByClicks(): void {
    this.clicks$
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.clicksCount++;

          if (this.clicksCount > MAX_CLICKS_COUNT) {
            this.ejectSnowflakes();
          }
        }),
        debounceTime(WAIT_TIME),
        filter(() => this.clicksCount > 0)
      )
      .subscribe(() => {
        this.ejectSnowflakes();
      });
  }

  private spawnWaves(count: number): void {
    const waves: Wave[] = this.getWaves(count);

    for (let i: number = 0; i < count; i++) {
      setTimeout(() => {
        this.spawnWave(waves[i]);
      }, i * WAVE_DELAY);
    }
  }

  private spawnWave(wave: Wave): void {
    if (isNil(this.snowflakeRect)) {
      return;
    }

    const elements: HTMLElement[] = [];
    const fragment: DocumentFragment = this.document.createDocumentFragment();

    for (let i: number = 0; i < SNOWFLAKES_PER_WAVE; i++) {
      const element: HTMLElement = this.createSnowflake(wave[i]);

      elements.push(element);
      this.renderer.appendChild(fragment, element);
    }

    this.renderer.appendChild(this.document.body, fragment);

    setTimeout(() => {
      elements.forEach((el: HTMLElement) => el.remove());
    }, ANIMATION_DELAY);
  }

  private createSnowflake([x, y, zIndex, color]: Snowflake): HTMLElement {
    const element: HTMLElement = this.renderer.createElement('div');
    element.innerText = '❅';

    this.renderer.setStyle(element, 'top', this.startTop);
    this.renderer.setStyle(element, 'left', this.startLeft);
    this.renderer.setStyle(element, 'z-index', zIndex);
    this.renderer.addClass(element, 'snowflake');
    this.renderer.addClass(element, 'snowflake_small');
    this.renderer.addClass(element, 'snowflake_falling');

    element.style.setProperty('--snowflake-x', `${x}px`);
    element.style.setProperty('--snowflake-y', `${y}px`);
    element.style.setProperty('--snowflake-color', color);

    return element;
  }

  private getWaves(count: number): Wave[] {
    return Array.from({ length: count }, (_: unknown, index: number) =>
      this.getWave((1 + index) * 10)
    );
  }

  private getWave(zIndex: number): Wave {
    return Array.from({ length: SNOWFLAKES_PER_WAVE }, () => [
      this.getRandomX(),
      this.getRandomY(),
      zIndex,
      this.getRandomColor(),
    ]);
  }

  private getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  private getRandomX(): number {
    return (
      Math.random() * this.window.innerWidth - 0.5 * this.window.innerWidth
    );
  }

  private getRandomY(): number {
    if (isNil(this.snowflakeRect)) {
      return 0;
    }

    const height: number = this.window.innerHeight;

    return Math.random() * height - 0.5 * height + this.snowflakeRect.y;
  }
}
