import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavParams } from '@ionic/angular';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { Friend } from 'src/app/models/friend.model';
import { Group } from 'src/app/models/group.model';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { FriendService } from 'src/app/services/FriendService';
import { UIService } from 'src/app/services/ui.service';

@Component({
    selector: 'app-group-invite',
    templateUrl: './group-invite.component.html',
    styleUrls: ['./group-invite.component.scss'],
})
export class GroupInviteComponent implements OnInit {

    public group: Group;
    public selectedList: any[] = [];

    constructor(
        private navParams: NavParams,
        private friendService: FriendService,
        private carrierService: CarrierService,
        private router: Router,
        private appService: AppService,
        private modalController: ModalController,
        public UI: UIService
    ) {
        this.group = navParams.get("group");
    }

    async ngOnInit() {
        const friendList = await this.friendService.getOnlineFriendList();
        friendList.forEach(friend => {
            this.selectedList.push({
                did: friend.did,
                friend: friend,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(friend.nickname),
                },
                isSelected: false
            });
        });
    }

    onClose() {
        this.modalController.dismiss();
    }

    onChangeCheck(index) {
        this.selectedList[index].isSelected = !this.selectedList[index].isSelected;
    }

    onInvite() {
        let hasSelection = false;
        this.selectedList.forEach(item => {
            if (item.isSelected) {
                if (this.carrierService.isFriendOnline(item.did)) {
                    this.carrierService.inviteToGroup(this.group.groupId, item.did).catch(error => {
                        this.appService.toast("Friend '"+item.friend.nickname+"' could not get the invitation.", ToastType.WARNING);
                    });
                }
                else {
                    this.appService.toast("Friend '"+item.friend.nickname+"' has gone offline.", ToastType.WARNING);
                }
                hasSelection = true;
            }
        });
        if (hasSelection) {
            this.appService.toast("Group invitation has been sent.", ToastType.SUCCESS);
            this.modalController.dismiss();
        }
        else {
            this.appService.toast("Please select a friend.", ToastType.WARNING);
        }
    }
}
