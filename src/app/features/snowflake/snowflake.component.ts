import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { isNil } from '@bimeister/utilities';
import { Subject, debounceTime, filter, tap } from 'rxjs';

const MAX_CLICKS_COUNT: number = 5;
const SCALE_FACTOR: number = 5;
const ROTATION_FACTOR: number = 5;
const SNOWFLAKES_PER_WAVE: number = 150;
const WAVE_DELAY: number = 100;
const WAIT_TIME: number = 1500;

@Component({
  selector: 'app-snowflake',
  templateUrl: './snowflake.component.html',
  styleUrls: ['./snowflake.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
})
export class SnowflakeComponent implements AfterViewInit {
  @ViewChild('element', { read: ElementRef })
  public readonly snowflakeElement: ElementRef | undefined;

  public clicksCount: number = 0;

  public clicks$: Subject<void> = new Subject();

  public get snowflakeScale(): number {
    return 1 + this.clicksCount / SCALE_FACTOR;
  }

  public get snowflakeRotation(): string {
    if (this.clicksCount === 0) {
      return '0deg';
    }

    const value: number = ROTATION_FACTOR * this.snowflakeScale;

    return this.clicksCount % 2 === 0 ? `${value}deg` : `-${value}deg`;
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
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.clicks$
      .pipe(
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

  public ngAfterViewInit(): void {
    this.snowflakeRect =
      this.snowflakeElement?.nativeElement.getBoundingClientRect();
  }

  public handleClick(): void {
    this.clicks$.next();
  }

  public ejectSnowflakes(): void {
    this.spawnWaves(this.clicksCount);
    this.clicksCount = 0;
    this.changeDetectorRef.markForCheck();
  }

  private spawnWaves(count: number): void {
    for (let i: number = 0; i < count; i++) {
      setTimeout(() => {
        this.spawnWave(i);
      }, i * WAVE_DELAY);
    }
  }

  private spawnWave(index: number): void {
    if (isNil(this.snowflakeRect)) {
      return;
    }

    for (let i: number = 0; i < SNOWFLAKES_PER_WAVE; i++) {
      this.renderer.appendChild(
        document.body,
        this.createSnowflake(this.getRandomX(), this.getRandomY(), index)
      );
    }
  }

  private createSnowflake(x: number, y: number, zIndex: number): HTMLElement {
    const element: HTMLElement = this.renderer.createElement('div');
    const text: Element = this.renderer.createText('❅');
    this.renderer.appendChild(element, text);

    this.renderer.setStyle(element, 'top', this.startTop);
    this.renderer.setStyle(element, 'left', this.startLeft);
    this.renderer.setStyle(element, 'z-index', zIndex);
    this.renderer.addClass(element, 'snowflake');
    this.renderer.addClass(element, 'snowflake_small');
    this.renderer.addClass(element, 'snowflake_falling');

    element.style.setProperty('--snowflake-x', `${x}px`);
    element.style.setProperty('--snowflake-y', `${y}px`);
    element.style.setProperty('--snowflake-color', this.getRandomColor());

    setTimeout(() => {
      element.remove();
    }, 1000);

    return element;
  }

  private getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  private getRandomX(): number {
    return Math.random() * window.innerWidth - 0.5 * window.innerWidth;
  }

  private getRandomY(): number {
    if (isNil(this.snowflakeRect)) {
      return 0;
    }

    const height: number = window.innerHeight;

    return Math.random() * height - 0.5 * height + this.snowflakeRect.y;
  }
}
