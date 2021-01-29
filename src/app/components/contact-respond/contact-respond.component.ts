import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { Friend } from 'src/app/models/friend.model';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { FriendService } from 'src/app/services/FriendService';
import { MessageService } from 'src/app/services/MessageService';
import { UIService } from 'src/app/services/ui.service';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-contact-respond',
    templateUrl: './contact-respond.component.html',
    styleUrls: ['./contact-respond.component.scss'],
})
export class ContactRespondComponent implements OnInit {

    public friend: Friend;

    constructor(
        private modalController: ModalController,
        private navParams: NavParams,
        private alertController: AlertController,
        private carrierService: CarrierService,
        private appService: AppService,
        private friendService: FriendService,
        private messageService: MessageService,
        public UI: UIService,
        private native: NativeService
    ) {
        this.friend = navParams.get("friend");
    }

    ngOnInit() {}

    onClose() {
        this.modalController.dismiss();
    }

    async onAccept() {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Accept Friend Request",
            message: "Please confirm to accept the friend request.",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async data => {
                        this.modalController.dismiss();
                        const acceptResponse = await this.carrierService.acceptFriend(this.friend.did);
                        if (acceptResponse) {
                            this.modalController.dismiss({
                                delete: false,
                                did: this.friend.did
                            });
                            this.appService.toast("You have successfully accepted a friend.", ToastType.SUCCESS);
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

    async onDecline() {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Decline Contact",
            message: "Are you sure you want to decline this contact?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        const deleteResponse = await this.friendService.deleteFriend(this.friend.did);
                        if (deleteResponse) {
                            this.modalController.dismiss({
                                delete: true,
                                userId: this.friend.did,
                            });
                            this.messageService.deleteTenant(this.friend.did);
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
}
