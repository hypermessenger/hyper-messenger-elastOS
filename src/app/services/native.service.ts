import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class NativeService {

    public alert = null;
    public modal = null;
    public popover = null;

    constructor(
        private zone: NgZone,
        private navCtrl: NavController,
        private router: Router
    ) {}

    public go(page: any, options: any = {}) {
        console.log('Navigating to: ', page);
        this.zone.run(() => {
            this.navCtrl.navigateForward([page], {state: options});
        });
    }

    public goBack() {
        this.zone.run(() => {
            this.navCtrl.back();
        });
    }

    async hideAlert() {
        if (this.alert) {
            await this.alert.dismiss();
            this.alert = null;
        }
    }

    async hideModal() {
        if (this.modal) {
            await this.modal.dismiss();
            this.modal = null;
        }
    }

    async hidePopover() {
        if (this.popover) {
            await this.popover.dismiss();
            this.popover = null;
        }
    }
}
