import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { Friend } from 'src/app/models/friend.model';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { UIService } from 'src/app/services/ui.service';
import { InviteSuccessComponent } from '../invite-success/invite-success.component';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-contact-details',
    templateUrl: './contact-details.component.html',
    styleUrls: ['./contact-details.component.scss'],
})
export class ContactDetailsComponent implements OnInit {

    public friend: Friend;
    public message: string;

    constructor(
        private modalController: ModalController,
        private navParams: NavParams,
        private alertController: AlertController,
        private carrierService: CarrierService,
        private appService: AppService,
        public UI: UIService,
        private native: NativeService
    ) {
        this.friend = navParams.get("friend");
        const messageObject = JSON.parse(this.friend.message);
        this.message = messageObject.message;
    }

    ngOnInit() {}

    onClose() {
        this.modalController.dismiss();
    }

    async onReinvite() {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Reinvite Contact",
            message: "Please confirm to reinvite this contact.",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        await this.appService.showSpinner();
                        const removeResponse = this.carrierService.removeFriend(this.friend.did);
                        if (removeResponse) {
                            const addResponse = await this.carrierService.addFriend(
                                this.friend.did, this.friend.address, this.friend.message, this.friend.nickname
                            );
                            if (addResponse) {
                                await this.showInviteSuccess();
                                this.appService.hideSpinner();
                            } else {
                                this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                            }
                        } else {
                            this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                        }
                    }
                }
            ]
        });
        this.native.alert.onWillDismiss().then(() => {
            this.native.alert = null;
        });
        await this.native.alert.present();
    }

    async onWithdraw() {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Withdraw Contact",
            message: "Are you sure you want to withdraw this contact?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        const removeResponse = this.carrierService.removeFriend(this.friend.did);
                        if (removeResponse) {
                            this.modalController.dismiss({
                                delete: true,
                                did: this.friend.did
                            });
                            this.appService.toast("You have successfully removed a friend.", ToastType.SUCCESS);
                        } else {
                            this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                        }
                    }
                }
            ]
        });
        this.native.alert.onWillDismiss().then(() => {
            this.native.alert = null;
        });
        await this.native.alert.present();
    }

    async showInviteSuccess() {
        this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: InviteSuccessComponent,
            componentProps: {}
        });
        this.native.modal.onWillDismiss().then(() => {
            this.native.modal = null;
        });
        return await this.native.modal.present();
    }

}
