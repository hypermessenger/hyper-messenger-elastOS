import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegisterHivePage } from './register-hive.page';

const routes: Routes = [
  {
    path: '',
    component: RegisterHivePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterHivePageRoutingModule {}
