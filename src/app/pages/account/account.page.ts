import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';
import { UIService } from 'src/app/services/ui.service';
import { Tab } from '../tabs/tabs';
import { StorageService } from 'src/app/services/StorageService';


@Component({
    selector: 'app-account',
    templateUrl: './account.page.html',
    styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit, Tab {

    public name: string;

    constructor(
        private appService: AppService,
        private storageService: StorageService,
        public native: NativeService,
        public UI: UIService,
    ) {}

    ngOnInit() {}

    ionViewWillEnter() {
        this.getSelfInfo();
        this.appService.setBackground('#ffffff', true);
    }

    ionViewWillLeave() {
        this.appService.setWhiteBackground();
    }

    tabWillEnter() {}

    tabWillLeave() {}

    async getSelfInfo() {
        this.name = await this.storageService.getProperty("name");
    }

}
