import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfileInfoPageRoutingModule } from './profile-info-routing.module';

import { ProfileInfoPage } from './profile-info.page';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfileInfoPageRoutingModule,
    QRCodeModule
  ],
  declarations: [ProfileInfoPage]
})
export class ProfileInfoPageModule {}
