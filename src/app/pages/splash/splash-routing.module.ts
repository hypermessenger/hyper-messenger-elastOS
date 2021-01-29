import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SplashPage } from './splash.page';
import { TabsPage } from '../tabs/tabs.page';
import { TabsPageModule } from '../tabs/tabs.module';
import { TabsPageRoutingModule } from '../tabs/tabs-routing.module';

const routes: Routes = [
  {
    path: '',
    component: SplashPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SplashPageRoutingModule {}
