import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FriendProfilePageRoutingModule } from './friend-profile-routing.module';

import { FriendProfilePage } from './friend-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FriendProfilePageRoutingModule
  ],
  declarations: [FriendProfilePage]
})
export class FriendProfilePageModule {}
