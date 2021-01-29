import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditInfoPageRoutingModule } from './edit-info-routing.module';

import { EditInfoPage } from './edit-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditInfoPageRoutingModule
  ],
  declarations: [EditInfoPage]
})
export class EditInfoPageModule {}
