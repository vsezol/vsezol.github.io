import { CommonModule } from '@angular/common';
import { NgModule, Type } from '@angular/core';
import { PupaCommonModule } from '@bimeister/pupakit.common';
import { PupaKitModule } from '@bimeister/pupakit.kit';
import { NonNullablePipe } from './pipes/non-nullable.pipe';

const MODULES: Type<unknown>[] = [
  CommonModule,
  PupaCommonModule,
  PupaKitModule,
];

const PIPES: Type<unknown>[] = [NonNullablePipe];

@NgModule({
  declarations: [PIPES],
  imports: [MODULES],
  exports: [MODULES, PIPES],
})
export class SharedModule {}
