import { Pipe, PipeTransform } from '@angular/core';
import { Nullable, isNil } from '@bimeister/utilities';

@Pipe({
  name: 'nonNullable',
  pure: true,
  standalone: true,
})
export class NonNullablePipe implements PipeTransform {
  public transform<T, U = T>(value: Nullable<T>, defaultValue: T | U): T | U {
    return isNil(value) ? defaultValue : value;
  }
}
