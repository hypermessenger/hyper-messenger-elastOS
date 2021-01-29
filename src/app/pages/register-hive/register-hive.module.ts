import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterHivePageRoutingModule } from './register-hive-routing.module';

import { RegisterHivePage } from './register-hive.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterHivePageRoutingModule
  ],
  declarations: [RegisterHivePage]
})
export class RegisterHivePageModule {}
