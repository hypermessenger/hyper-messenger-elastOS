import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { FriendService } from 'src/app/services/FriendService';
import { Friend } from 'src/app/models/friend.model';
import { CarrierService } from 'src/app/services/CarrierService';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { GroupInviteComponent } from 'src/app/components/group-invite/group-invite.component';
import { GroupService } from 'src/app/services/GroupService';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-add-group',
    templateUrl: './add-group.page.html',
    styleUrls: ['./add-group.page.scss'],
})
export class AddGroupPage implements OnInit {

    public groupName: string = "";
    public selectedList: any[] = [];

    constructor(
        private appService: AppService,
        private friendService: FriendService,
        private carrierService: CarrierService,
        private groupService: GroupService,
        private modalController: ModalController,
        private router: Router,
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
        this.appService.setTitle("Create Group");
    }

    ionViewWillLeave() {}

    async ngOnInit() {
        const friendList = await this.friendService.getOnlineFriendList();
        friendList.forEach(friend => {
            this.selectedList.push({
                did: friend.did,
                nickname: friend.nickname,
                isSelected: false
            });
        });
    }

    onFinish() {
        if (this.groupName === "") {
            this.appService.toast("Group name is empty.", ToastType.WARNING);
        } else {
            this.appService.showSpinner();
            this.carrierService.createGroup(this.groupName).then(groupId => {
                if (groupId != null) {
                    let hasSelection = false;
                    this.selectedList.forEach(item => {
                        if (item.isSelected) {
                            this.carrierService.inviteToGroup(groupId, item.did).catch(error => {
                                this.appService.toast("Friend '"+item.nickname+"' could not get the invitation.", ToastType.WARNING);
                            });
                        }
                    });
                    this.router.navigate(["/home/tabs/groups"]);
                    this.inviteFriend(groupId);
                } else {
                    this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
                }
                this.appService.hideSpinner();
            });
        }
    }

    async inviteFriend(groupId: string) {
        const group = await this.groupService.getGroup(groupId);
        const onlineFriendCount = (await this.friendService.getOnlineFriendList()).length;
        if (onlineFriendCount > 0) {
            await this.native.hideModal();
            this.native.modal = await this.modalController.create({
                component: GroupInviteComponent,
                cssClass: "groupInviteModal",
                componentProps: {
                    group: group
                }
            });
            this.native.modal.onWillDismiss().then(() => {
                this.native.modal = null;
            });
            return await this.native.modal.present();
        } else {
            this.appService.toast("There is no online friend to invite.", ToastType.WARNING);
        }
    }


}
