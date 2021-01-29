import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PublishDidPage } from './publish-did.page';

const routes: Routes = [
  {
    path: '',
    component: PublishDidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublishDidPageRoutingModule {}
