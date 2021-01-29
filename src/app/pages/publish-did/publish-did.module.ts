import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PublishDidPageRoutingModule } from './publish-did-routing.module';

import { PublishDidPage } from './publish-did.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PublishDidPageRoutingModule
  ],
  declarations: [PublishDidPage]
})
export class PublishDidPageModule {}
