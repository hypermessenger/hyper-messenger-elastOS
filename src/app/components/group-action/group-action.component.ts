import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';
import { GroupState } from 'src/app/models/enums/group-state.enum';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { Group } from 'src/app/models/group.model';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { GroupInviteComponent } from '../group-invite/group-invite.component';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-group-action',
    templateUrl: './group-action.component.html',
    styleUrls: ['./group-action.component.scss'],
})
export class GroupActionComponent implements OnInit {
    group: Group;
    isPending: boolean;

    constructor(
        private navParams: NavParams,
        private appService: AppService,
        private modalController: ModalController,
        private alertController: AlertController,
        private carrierService: CarrierService,
        private native: NativeService
    ) {
        this.group = navParams.get("group");
        this.isPending = (this.group.state === GroupState.PENDING);
    }

    ngOnInit() {}

    onClose() {
        this.modalController.dismiss();
    }

    async onInvite() {
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: GroupInviteComponent,
            cssClass: "groupInviteModal",
            componentProps: {
                group: this.group
            }
        });
        this.native.modal.onWillDismiss().then(() => {
            this.native.modal = null;
        });
        return await this.native.modal.present();
    }

    async onJoin() {
        await this.native.hideModal();
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Accept Group Invitation",
            message: "Please confirm that you join the group.",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async data => {
                        await this.appService.showSpinner();
                        let joinResponse = await this.carrierService.joinGroup(this.group);
                        await this.appService.hideSpinner();
                        if (joinResponse) {
                            this.appService.toast("You have successfully joined to the group.", ToastType.SUCCESS);
                        }
                        else {
                            this.appService.toast("Make sure your friend is online.", ToastType.WARNING);
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

    async onLeave() {
        await this.native.hideModal();
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Leave Group",
            message: "Leaving " + this.group.title + ". Are you sure you want to continue?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        this.carrierService.deleteGroup(this.group).then(response => {
                            this.appService.toast("You have successfully left a group.", ToastType.SUCCESS);
                        }, error => {
                            this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                        });
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
