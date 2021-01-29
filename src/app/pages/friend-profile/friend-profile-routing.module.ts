import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FriendProfilePage } from './friend-profile.page';

const routes: Routes = [
  {
    path: '',
    component: FriendProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FriendProfilePageRoutingModule {}
