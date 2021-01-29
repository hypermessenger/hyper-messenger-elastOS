import { Component, OnInit, NgZone } from '@angular/core';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
    selector: 'app-register-hive',
    templateUrl: './register-hive.page.html',
    styleUrls: ['./register-hive.page.scss'],
})
export class RegisterHivePage implements OnInit {
    isHiveRegistered = false;

    constructor(
        private appService: AppService,
        private native: NativeService,
        private zone: NgZone,
    ) {}

    async ngOnInit() {
        this.isHiveRegistered = await this.appService.isHiveRegistered();
    }

    /*ionViewWillEnter() {
        this.appService.showApp();
    }*/

    async onCheckHive() {
        const isHiveRegistered = await this.appService.isHiveRegistered();
        if (isHiveRegistered) {
            this.isHiveRegistered = true;
        } else {
            this.appService.toast(
                "Your Hive vault is not registered yet. If you have already initiated registration, please wait for the confirmation.",
                ToastType.WARNING
            );
        }
    }

    async onRegisterHive() {
        await this.appService.setupHive();
    }

    async onContinue() {
        this.native.go("/sign-did");
    }
}
