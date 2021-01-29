import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'splash',
        loadChildren: () => import('./pages/splash/splash.module').then( m => m.SplashPageModule)
    },
    {
        path: 'onboard',
        loadChildren: () => import('./pages/onboard/onboard.module').then( m => m.OnboardPageModule)
    },
    {
        path: 'publish-did',
        loadChildren: () => import('./pages/publish-did/publish-did.module').then( m => m.PublishDidPageModule)
    },
    {
        path: 'register-hive',
        loadChildren: () => import('./pages/register-hive/register-hive.module').then( m => m.RegisterHivePageModule)
    },
    {
        path: 'sign-did',
        loadChildren: () => import('./pages/sign-did/sign-did.module').then( m => m.SignDidPageModule)
    },
    {
        path: 'get-started',
        loadChildren: () => import('./pages/get-started/get-started.module').then( m => m.GetStartedPageModule)
    },
    {
        path: 'home',
        loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule)
    },
    {
        path: 'friend-profile',
        loadChildren: () => import('./pages/friend-profile/friend-profile.module').then( m => m.FriendProfilePageModule)
    },
    {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule)
    },
    {
        path: 'add-friend',
        loadChildren: () => import('./pages/add-friend/add-friend.module').then( m => m.AddFriendPageModule)
    },
    {
        path: 'add-group',
        loadChildren: () => import('./pages/add-group/add-group.module').then( m => m.AddGroupPageModule)
    },
    {
        path: 'chat',
        loadChildren: () => import('./pages/chat/chat.module').then( m => m.ChatPageModule)
    },
    {
        path: 'chat-group',
        loadChildren: () => import('./pages/chat-group/chat-group.module').then( m => m.ChatGroupPageModule)
    },
    {
        path: 'edit-info',
        loadChildren: () => import('./pages/edit-info/edit-info.module').then( m => m.EditInfoPageModule)
    },
    {
        path: 'profile-info',
        loadChildren: () => import('./pages/profile-info/profile-info.module').then( m => m.ProfileInfoPageModule)
    },
    {
        path: 'edit-profile',
        loadChildren: () => import('./pages/edit-profile/edit-profile.module').then( m => m.EditProfilePageModule)
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
