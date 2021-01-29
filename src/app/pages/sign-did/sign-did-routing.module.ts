import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SignDidPage } from './sign-did.page';

const routes: Routes = [
  {
    path: '',
    component: SignDidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SignDidPageRoutingModule {}
