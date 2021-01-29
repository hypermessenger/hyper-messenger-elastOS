import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Group } from 'src/app/models/group.model';
import { Subscription } from 'rxjs';
import { AlertController, MenuController, ModalController, PopoverController } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { Tab } from '../tabs/tabs';
import { EventService } from 'src/app/services/EventService';
import { GroupService } from 'src/app/services/GroupService';
import { GroupDirection } from 'src/app/models/enums/group-direction.enum';
import { GroupState } from 'src/app/models/enums/group-state.enum';
import { FriendService } from 'src/app/services/FriendService';
import { NavigationExtras, Router } from '@angular/router';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';
import { UIService } from 'src/app/services/ui.service';
import { Avatar, TempAvatar } from 'src/app/models/avatar.model';
import { OptionsComponent } from 'src/app/components/options/options.component';
import { GroupMessageService } from 'src/app/services/GroupMessageSerivce';
import { GroupMessage } from 'src/app/models/group-message.model';
import { GroupMessageDirection } from 'src/app/models/enums/group-message-direction.enum';
import { GroupInviteComponent } from 'src/app/components/group-invite/group-invite.component';
import { GroupActionComponent } from 'src/app/components/group-action/group-action.component';

export type UIState = {
    group: Group,
    avatar?: Avatar,
    tempAvatar: TempAvatar,
    isVisible: boolean,
    isBold: boolean,
    isSeen: boolean,
    isReceived: boolean,
    messageText: string,
    messageCount: number,
    date: number,
    dateTime: string,
    isPending: boolean,
    isJoinable: boolean
};

@Component({
    selector: 'app-groups',
    templateUrl: './groups.page.html',
    styleUrls: ['./groups.page.scss'],
})
export class GroupsPage implements OnInit, OnDestroy, Tab {

    slideOpts = {
        initialSlide: 0,
        speed: 200,
        zoom: true,
        slidesPerView: 5.5
    };

    hasGroup: boolean = false;
    groupList: Group[] = [];
    stateList: UIState[] = [];
    groupSub: Subscription;
    messageSubMap = new Map<string, Subscription>(); //key: groupId
    isSubActive = false;

    popover = null;

    constructor(
        private menuController: MenuController,
        private carrierService: CarrierService,
        private eventService: EventService,
        private ngZone: NgZone,
        private router: Router,
        public groupService: GroupService,
        private groupMessageService: GroupMessageService,
        private friendService: FriendService,
        private popoverController: PopoverController,
        private modalController: ModalController,
        private alertController: AlertController,
        private appService: AppService,
        public native: NativeService,
        public UI: UIService,
    ) {}

    ionViewWillEnter() {
        this.appService.setWhiteBackground();
    }

    async init() {
        await this.setGroupList();
        await this.registerSubscribers();
    }

    destroy() {
        this.unregisterSubscribers();
    }

    tabWillEnter() {
        if (!this.isSubActive) {
            this.init();
        }
    }

    tabWillLeave() {
        if (this.isSubActive) {
            this.destroy();
        }
    }

    async ngOnInit() {
        //await this.init();
    }

    ngOnDestroy() {
        this.destroy();
    }

    async registerSubscribers() {
        this.groupSub = this.eventService.getObservable("groupService:change").subscribe((data: any) => {
            this.ngZone.run(async () => {
                await this.setGroupList();
            });
        });
        this.isSubActive = true;
    }

    unregisterSubscribers() {
        if (this.groupSub !== null) {
            this.groupSub.unsubscribe();
        }
        this.isSubActive = false;
        this.messageSubMap.forEach((value, key) => {
            value.unsubscribe();
        });
        this.messageSubMap.clear();
    }

    async setGroupList() {
        this.groupList = await this.groupService.getGroupList();
        this.setGroupVisibility(this.groupList.length);
        await this.setGroupState();
    }

    setGroupVisibility(count: number) {
        if (count > 0) {
            this.hasGroup = true;
        } else {
            this.hasGroup = false;
        }
    }

    async setGroupState() {
        for (let i = 0; i < this.groupList.length; i++) {
            const tempState: UIState = {
                group: this.groupList[i],
                avatar: null,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(this.groupList[i].title),
                },
                isVisible: true,
                isBold: false,
                isSeen: false,
                isReceived: true,
                messageText: null,
                messageCount: null,
                date: null,
                dateTime: null,
                isPending: false,
                isJoinable: false
            };

            if (this.groupList[i].state == GroupState.PENDING) {
                tempState.isPending = true;
                tempState.messageText = "Request is pending.";
            }
            else {
                tempState.isPending = false;
                tempState.messageText = "Start a conversation.";
            }

            if (this.groupList[i].direction == GroupDirection.RECEIVED) {
                tempState.isJoinable = true;
            }
            else {
                tempState.isJoinable = false;
            }

            const message: GroupMessage = await this.groupMessageService.getLastMessage(this.groupList[i].groupId);
            if (message == null) {
                if (this.groupList[i].direction == GroupDirection.SENT) {
                    tempState.messageText = "Invite your friends.";
                }
                tempState.isVisible = false;
                tempState.isBold = false;
            }
            else {
                tempState.messageCount = 0;
                if (message.direction == GroupMessageDirection.SENT) {
                    tempState.isSeen = message.isSeen;
                    tempState.messageText = "You: "+message.text;
                    tempState.isReceived = false;
                    tempState.isBold = false;
                }
                else if (message.direction == GroupMessageDirection.RECEIVED) {
                    const count = await this.groupMessageService.getUnseenReceivedMessageCount(this.groupList[i].groupId);
                    if (count > 0) {
                        tempState.messageCount = count;
                        tempState.isSeen = false;
                        tempState.isBold = true;
                    }
                    else {
                        tempState.messageCount = 0;
                        tempState.isSeen = true;
                        tempState.isBold = false;
                    }

                    tempState.messageText = message.text;
                    tempState.isReceived = true;
                }
                tempState.date = new Date(message.timestamp).getTime();
                tempState.dateTime = new Date(message.timestamp).toTimeString().substring(0, 5);
                tempState.isVisible = true;
            }
            this.stateList[i] = tempState;

            if (!this.messageSubMap.has(this.groupList[i].groupId)) {
                let messageSub = this.eventService.getObservable("groupMessageService:change:"+this.groupList[i].groupId).subscribe((data: any) => {
                    this.ngZone.run(async () => {
                        await this.setGroupList();
                    });
                });
                this.messageSubMap.set(this.groupList[i].groupId, messageSub);
            }
        }
        if (this.stateList.length > this.groupList.length) {
            this.stateList = this.stateList.slice(0, this.groupList.length);
        }
    }

    onMenu() {
        this.menuController.toggle("sideMenu");
    }

    async onCard(index) {
        const group = this.groupList[index];
        if (this.stateList[index].messageCount > 0) {
            this.groupMessageService.setReceivedMessagesSeen(group.groupId);
        }

        if (group.state === GroupState.PENDING) {
            this.appService.toast("Please accept the group invitation.", ToastType.WARNING);
        } else if(!(await this.carrierService.hasGroupMember(group.groupId))) {
            this.appService.toast("Group has no other members.", ToastType.WARNING);
        } else {
            const navExtras: NavigationExtras = {
                state: {
                    group: group
                }
            };
            this.router.navigate(["/chat-group"], navExtras);
        }
    }

    async onAction(group: Group, event: any) {
        event.stopPropagation();
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: GroupActionComponent,
            cssClass: "groupActionModal",
            componentProps: {
                group: group
            }
        });
        this.native.modal.onWillDismiss().then(() => {
            this.native.modal = null;
        });
        return await this.native.modal.present();
    }

    async onJoin(group: Group) {
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
                        const joinResponse = await this.carrierService.joinGroup(group);
                        await this.appService.hideSpinner();
                        if (joinResponse) {
                            this.appService.toast("You have successfully joined to the group.", ToastType.SUCCESS);
                        } else {
                            this.appService.toast("Both you and inviter must be online at the same time to join.", ToastType.WARNING);
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

    async onInvite(group: Group) {
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

    async onLeave(group: Group) {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Leave Group",
            message: "Leaving " + group.title + ". Are you sure you want to continue?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        this.carrierService.deleteGroup(group).then(response => {
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

    /*async onOptions(ev: any) {
        this.popover = await this.popoverController.create({
            mode: 'ios',
            component: OptionsComponent,
            componentProps: {
                type: 'group',
            },
            cssClass: 'optionsComponent',
            event: ev,
            translucent: false
        });
        this.popover.onWillDismiss().then(() => {
            this.popover = null;
        });
        return await this.popover.present();
    }*/
}
