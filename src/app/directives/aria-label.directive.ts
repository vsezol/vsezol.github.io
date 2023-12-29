import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { isNil } from '@bimeister/utilities';

@Directive({
  selector: '[appAriaLabel]',
  standalone: true,
})
export class AriaLabelDirective implements OnInit {
  @Input() public appAriaLabel: string | undefined;
  @Input() public selector: string | undefined;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  public ngOnInit(): void {
    this.setAttribute();
  }

  private setAttribute(): void {
    if (isNil(this.appAriaLabel) || isNil(this.selector)) {
      return;
    }

    const element: HTMLElement = this.elementRef.nativeElement.querySelector(
      this.selector
    );

    this.renderer.setAttribute(element, 'aria-label', this.appAriaLabel);
  }
}
