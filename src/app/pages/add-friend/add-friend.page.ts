import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { AppService } from 'src/app/services/AppService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { CarrierService } from 'src/app/services/CarrierService';
import { StorageService } from 'src/app/services/StorageService';
import { HiveService } from 'src/app/services/HiveService';
import { ModalController } from '@ionic/angular';
import { InviteSuccessComponent } from 'src/app/components/invite-success/invite-success.component';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-add-friend',
    templateUrl: './add-friend.page.html',
    styleUrls: ['./add-friend.page.scss'],
})
export class AddFriendPage implements OnInit {

    nickname = '';
    message = '';
    identity = '';

    public addingFriend = false;

    constructor(
        private router: Router,
        private appService: AppService,
        private carrierService: CarrierService,
        private storageService: StorageService,
        private hiveService: HiveService,
        private modalCtrl: ModalController,
        private native: NativeService
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

    ionViewWillEnter() {
        this.appService.setTitle("Invite Friend");
        this.appService.setBackground("#e31a50", false);

        this.nickname = '';
        this.identity = '';
        this.message = 'I would like to add you on Hyper Messenger.';
    }

    ionViewWillLeave() {
        this.appService.setWhiteBackground();
    }

    ngOnInit() {}

    onScan() {
        this.appService.scanFriendIdentity().then((scannedIdentity: string) => {
            this.identity = scannedIdentity;
            this.appService.toast("Identity has been scanned.", ToastType.SUCCESS);
        });
    }

    async onFinish() {
        if (this.identity === "") {
            this.appService.toast("Identity is empty.", ToastType.WARNING);
        }
        else if (this.message === "") {
            this.appService.toast("Message is empty.", ToastType.WARNING);
        }
        else {
            await this.addFriend(this.identity);
        }
    }

    async addFriend(friendDid: string) {
        await this.appService.showSpinner();
        this.addingFriend = true;
        await this.hiveService.addVault(friendDid);
        const friendAddress = await this.hiveService.callScriptGetUserData(friendDid, "address");
        if (friendAddress === null) {
            this.appService.toast("User doesn't have Hyper.", ToastType.WARNING);
        } else {
            const isValid = await this.carrierService.isValidAddress(friendAddress);
            if (isValid) {
                const messageObject: any = {
                    command: "newFriend",
                    message: this.message,
                    did: await this.storageService.getProperty("did"),
                    address: this.carrierService.getAddress(),
                    userId: this.carrierService.getUserId()
                };
                const addResponse = await this.carrierService.addFriend(
                    friendDid, friendAddress, JSON.stringify(messageObject), this.nickname
                );
                if (addResponse) {
                    this.appService.hideSpinner();
                    this.showInviteSuccess().then(() => {
                        this.router.navigate(["/home/tabs/contacts"]);
                    });
                } else {
                    this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                }
            } else {
                this.appService.toast("Identity is not valid.", ToastType.WARNING);
            }
        }
        this.identity = '';
        this.addingFriend = false;
        this.appService.hideSpinner();
    }

    async showInviteSuccess() {
        await this.native.hideModal();
        this.native.modal = await this.modalCtrl.create({
            component: InviteSuccessComponent,
            componentProps: {}
        });
        this.native.modal.onWillDismiss().then(() => {
            this.native.modal = null;
        });
        return await this.native.modal.present();
    }
}
