import { Component, OnInit, NgZone } from '@angular/core';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
    selector: 'app-publish-did',
    templateUrl: './publish-did.page.html',
    styleUrls: ['./publish-did.page.scss'],
})
export class PublishDidPage implements OnInit {
    isDidPublished = false;

    constructor(
        private appService: AppService,
        private native: NativeService,
        private zone: NgZone,
    ) {}

    async ngOnInit() {
        this.isDidPublished = await this.appService.isDidPublished();
    }

    ionViewWillEnter() {
        this.appService.showApp();
    }

    async onCheckDID() {
        const isDidPublished = await this.appService.isDidPublished();
        if (isDidPublished) {
            this.isDidPublished = true;
        }
        else {
            this.appService.toast("Your DID is not published yet. If you have already initiated publishing, please wait for the confirmation.", ToastType.WARNING);
        }
    }

    async onPublishDID() {
        appManager.sendIntent("https://did.elastos.net/promptpublishdid", {}, {}, (ret: any) => {
            this.zone.run(() => {
                console.log("promptpublishdid success", ret);
            });
        }, (error: any) => {
            console.log("promptpublishdid err", error);
        });
    }

    async onContinue() {
        this.native.go("/register-hive");
    }
}
