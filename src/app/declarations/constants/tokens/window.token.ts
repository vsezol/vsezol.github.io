import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';
import { isNil } from '@bimeister/utilities';

export const WINDOW: InjectionToken<Window> = new InjectionToken<Window>(
  'An abstraction over global window object',
  {
    factory: () => {
      const defaultView: (Window & typeof globalThis) | null =
        inject(DOCUMENT).defaultView;

      if (isNil(defaultView)) {
        throw new Error('There is no window');
      }

      return defaultView;
    },
  }
);
