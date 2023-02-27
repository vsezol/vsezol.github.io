import { CommonModule } from '@angular/common';
import { NgModule, Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PupaCommonModule } from '@bimeister/pupakit.common';
import { PupaFormsModule } from '@bimeister/pupakit.forms';
import { IconDefinition, PupaIconsModule } from '@bimeister/pupakit.icons';
import { PupaKitModule } from '@bimeister/pupakit.kit';
import { PupaOverlaysModule } from '@bimeister/pupakit.overlays';
import { NonNullablePipe } from './pipes/non-nullable.pipe';

const MODULES: Type<unknown>[] = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  PupaCommonModule,
  PupaKitModule,
  PupaFormsModule,
  PupaOverlaysModule,
];

const ICONS: IconDefinition[] = [];

const PIPES: Type<unknown>[] = [NonNullablePipe];

@NgModule({
  declarations: [...PIPES],
  imports: [...MODULES, PupaIconsModule.forFeature(ICONS)],
  exports: [...MODULES, PupaIconsModule, ...PIPES],
})
export class SharedModule {}
