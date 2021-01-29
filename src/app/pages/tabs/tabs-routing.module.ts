import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
    {
        path: 'tabs',
        component: TabsPage,
        children: [
            {
                path: 'messages',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                        import('../messages/messages.module').then(m => m.MessagesPageModule)
                    }
                ]
            },
            {
                path: 'groups',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                        import('../groups/groups.module').then(m => m.GroupsPageModule)
                    }
                ]
            },
            {
                path: 'contacts',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                        import('../contacts/contacts.module').then(m => m.ContactsPageModule)
                    }
                ]
            },
            {
                path: 'account',
                children: [
                    {
                        path: '',
                        loadChildren: () =>
                        import('../account/account.module').then(m => m.AccountPageModule)
                    }
                ]
            },
            {
                path: '',
                redirectTo: '/home/tabs/messages',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/home/tabs/messages',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TabsPageRoutingModule {}
