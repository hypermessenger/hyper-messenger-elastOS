import { Component, OnInit } from '@angular/core';
import { EventService } from 'src/app/services/EventService';
import { CarrierService } from 'src/app/services/CarrierService';
import { AppService } from 'src/app/services/AppService';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { NativeService } from 'src/app/services/native.service';
import { StorageService } from 'src/app/services/StorageService';
import { UIService } from 'src/app/services/ui.service';
import { Router } from '@angular/router';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

export type ProfileInfo = {
    title: string,
    type: string,
    value: string
};

@Component({
    selector: 'app-profile-info',
    templateUrl: './profile-info.page.html',
    styleUrls: ['./profile-info.page.scss'],
})
export class ProfileInfoPage implements OnInit {

    public identity = "undefined";
    public name: string = "Anonymous";
    public profileInfo: ProfileInfo[] = [];

    constructor(
        private router: Router,
        private clipboard: Clipboard,
        private appService: AppService,
        private storageService: StorageService,
        public native: NativeService,
        public UI: UIService
    ) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation.extras.state) {
            if (navigation.extras.state.fromGetStartedPage) {
                this.appService.setBackToHome();
            }
            else {
                appService.setBack();
            }
        }
        else {
            appService.setBack();
        }
    }

    ngOnInit() {}

    async ionViewWillEnter() {
        this.appService.setTitle('Your Profile');
        this.appService.setBackground('#ffffff', true);
        // this.appService.setBackground('#3980eb', false);

        this.identity = await this.storageService.getProperty("did");
        this.getSelfInfo();
        this.setEditProfileTab();
    }

    setEditProfileTab() {
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
            key: "editProfile",
            iconPath: TitleBarPlugin.BuiltInIcon.EDIT
        });
    }

    ionViewWillLeave() {
        this.appService.setBackground('#ffffff', true);
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, null);
    }

    async getSelfInfo() {
        this.name = await this.storageService.getProperty("name");
        const phone = await this.storageService.getProperty("phone");
        const email = await this.storageService.getProperty("email");
        const location = await this.storageService.getProperty("location");
        const gender = await this.storageService.getProperty("gender");
        const description = await this.storageService.getProperty("description");
        this.profileInfo = [];
        this.profileInfo.push(
            {
                title: 'Name',
                type: 'name',
                value: this.name
            },
            {
                title: 'Phone',
                type: 'phone',
                value: phone == null ? "" : phone
            },
            {
                title: 'Email',
                type: 'email',
                value: email == null ? "" : email
            },
            {
                title: 'Location',
                type: 'location',
                value: location == null ? "" : location
            },
            {
                title: 'Gender',
                type: 'gender',
                value: gender == null ? "" : gender
            },
            {
                title: 'Description',
                type: 'description',
                value: description == null ? "" : description
            }
        );
    }

    onCopyIdentity() {
        this.clipboard.copy(this.identity);
        this.appService.toast("Identity has been copied to clipboard.", ToastType.SUCCESS);
    }

    editInfo(info) {
        this.native.go('/edit-info', {profileInfo: info});
    }
}
