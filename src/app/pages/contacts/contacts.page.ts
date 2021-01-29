import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { EventService } from 'src/app/services/EventService';
import { Friend } from 'src/app/models/friend.model';
import { FriendService } from 'src/app/services/FriendService';
import { AlertController, ModalController, PopoverController, MenuController } from '@ionic/angular';
import { PopupMyaddressComponent } from 'src/app/components/popup-myaddress/popup-myaddress.component';
import { Subscription } from 'rxjs';
import { Tab } from '../tabs/tabs';
import { NavigationExtras, Router } from '@angular/router';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';
import { UIService } from 'src/app/services/ui.service';
import { Avatar, TempAvatar } from 'src/app/models/avatar.model';
import { MessageService } from 'src/app/services/MessageService';
import { Message } from 'src/app/models/message.model';
import { ConnectionState } from 'src/app/models/enums/connection-state.enum';
import { ContactDetailsComponent } from 'src/app/components/contact-details/contact-details.component';
import { ContactRespondComponent } from 'src/app/components/contact-respond/contact-respond.component';


export enum ActiveFilter {
    FRIENDS = 1,
    REQUEST = 2,
    INVITATION = 3
};

export type UIState = {
    friend: Friend,
    avatar?: Avatar,
    tempAvatar: TempAvatar,
    lastMessage?: string,
};

@Component({
    selector: 'app-contacts',
    templateUrl: './contacts.page.html',
    styleUrls: ['./contacts.page.scss'],
})
export class ContactsPage implements OnInit, OnDestroy, Tab {

    hasContact: boolean = false;
    activeFriendList: Friend[] = [];
    requestFriendList: Friend[] = [];
    invitationFriendList: Friend[] = [];

    activeStateList: UIState[] = [];
    requestStateList: UIState[] = [];
    invitationStateList: UIState[] = [];
    friendSub: Subscription;
    isSubActive = false;
    activeFilter: ActiveFilter = ActiveFilter.FRIENDS;

    ConnectionState = ConnectionState;

    constructor(
        private carrierService: CarrierService,
        private eventService: EventService,
        private appService: AppService,
        private messageService: MessageService,
        private ngZone: NgZone,
        private router: Router,
        private friendService: FriendService,
        private alertController: AlertController,
        private popoverController: PopoverController,
        private menuController: MenuController,
        private modalController: ModalController,
        public native: NativeService,
        public UI: UIService,
    ) {}

    async ionViewWillEnter() {
        this.appService.setWhiteBackground();
    }

    async init() {
        await this.setFriendList();
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

    ngOnInit() {
        //await this.init();
    }

    ngOnDestroy() {
        this.destroy();
    }

    async registerSubscribers() {
        this.friendSub = this.eventService.getObservable("friendService:change").subscribe((data: any) => {
            this.ngZone.run(async () => {
                await this.setFriendList();
            });
        });
        this.isSubActive = true;
    }

    unregisterSubscribers() {
        if (this.friendSub != null) {
            this.friendSub.unsubscribe();
        }
        this.isSubActive = false;
    }

    async setFriendList() {
        this.activeFriendList = await this.friendService.getActiveFriendList();
        this.activeFriendList.forEach(async (friend, index) => {
            const lastMessage: Message = await this.messageService.getLastMessage(friend.userId);
            const tempState: UIState = {
                friend: friend,
                avatar: null,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(friend.nickname),
                },
                lastMessage: lastMessage ? new Date(lastMessage.timestamp).toTimeString().substring(0, 5) : null,
            };
            this.activeStateList[index] = tempState;
        });
        this.activeStateList = (this.activeFriendList.length === 0) ? [] : this.activeStateList;
        if (this.activeStateList.length > this.activeFriendList.length) {
            this.activeStateList = this.activeStateList.slice(0, this.activeFriendList.length);
        }

        this.requestFriendList = await this.friendService.getPendingReceivedFriendList();
        this.requestStateList = [];
        this.requestFriendList.forEach(async (friend, index) => {
            const tempState: UIState = {
                friend: friend,
                avatar: null,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(friend.nickname),
                },
            };
            this.requestStateList[index] = tempState;
        });
        this.requestStateList = (this.requestFriendList.length === 0) ? [] : this.requestStateList;
        if (this.requestStateList.length > this.requestFriendList.length) {
            this.requestStateList = this.requestStateList.slice(0, this.requestFriendList.length);
        }

        this.invitationFriendList = await this.friendService.getPendingSentFriendList();
        this.invitationStateList = [];
        this.invitationFriendList.forEach(async (friend, index) => {
            const tempState: UIState = {
                friend: friend,
                avatar: null,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(friend.nickname),
                },
            };
            this.invitationStateList[index] = tempState;
        });
        this.invitationStateList = (this.invitationFriendList.length == 0) ? [] : this.invitationStateList;
        if (this.invitationStateList.length > this.invitationFriendList.length) {
            this.invitationStateList = this.invitationStateList.slice(0, this.invitationFriendList.length);
        }

        this.setContactVisibility(this.activeFriendList.length + this.requestFriendList.length + this.invitationFriendList.length);
        //this.sortContacts();
    }

    setContactVisibility(count: number) {
        if (count > 0) {
            this.hasContact = true;
        } else {
            this.hasContact = false;
        }
    }

    sortContacts() {
        this.activeStateList = this.activeStateList.sort((a, b) => a.friend.nickname > b.friend.nickname ? 1 : -1);
        this.requestStateList = this.requestStateList.sort((a, b) => a.friend.nickname > b.friend.nickname  ? 1 : -1);
        this.invitationStateList = this.invitationStateList.sort((a, b) => a.friend.nickname > b.friend.nickname  ? 1 : -1);
    }

    async onMyAddress() {
        this.native.hidePopover();
        this.native.popover = await this.popoverController.create({
            component: PopupMyaddressComponent,
            translucent: true
        });
        this.native.popover.onWillDismiss().then(() => {
            this.native.popover = null;
        });
        await this.native.popover.present();
    }

    onMenu() {
        this.menuController.toggle("sideMenu");
    }

    viewContact(friend: Friend) {
        this.native.go("friend-profile", {friend: friend});
    }

    async messageContact(state: UIState) {
        const messageCount = await this.messageService.getUnseenReceivedMessageCount(state.friend.did);
        if (messageCount > 0) {
            const messageObject: any = { command: "messageSeen" };
            this.carrierService.sendFriendMessage(state.friend.did, messageObject);
            this.messageService.setReceivedMessagesSeen(state.friend.did);
        }

        const friend: Friend = state.friend;
        const navExtras: NavigationExtras = {
            state: {
                friend: friend
            }
        };
        this.router.navigate(["/chat"], navExtras);
    }

    async onDelete(friend: Friend) {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Remove Contact",
            message: "Are you sure you want to remove this contact? If you confirm, the conversation will be deleted as well.",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        const removeResponse = this.carrierService.removeFriend(friend.did);
                        if (removeResponse) {
                            this.appService.toast("You have successfully removed a friend.", ToastType.SUCCESS);
                        }
                        else {
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

    onAddContact() {
        this.router.navigate(["/add-friend"]);
    }

    onFriendsFilter() {
        this.activeFilter = ActiveFilter.FRIENDS;
    }

    onRequestFilter() {
        this.activeFilter = ActiveFilter.REQUEST;
    }

    onInvitationFilter() {
        this.activeFilter = ActiveFilter.INVITATION;
    }

    getFilter(filter: ActiveFilter) {
        if (this.activeFilter === filter) {
            return "active-filter";
        } else {
            return "inactive-filter";
        }
    }

    async onRespond(friend: Friend) {
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: ContactRespondComponent,
            cssClass: "respondModal",
            componentProps: {
                friend: friend
            }
        });
        this.native.modal.onWillDismiss().then((params) => {
            this.native.modal = null;
            if (params.data) {
                this.requestStateList = this.requestStateList.filter(
                    (request) => request.friend.did !== params.data.did
                );
                this.setFriendList();
            }
        });
        return await this.native.modal.present();
    }

    async onDetails(friend: Friend) {
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: ContactDetailsComponent,
            cssClass: "detailsModal",
            componentProps: {
                friend: friend
            }
        });
        this.native.modal.onWillDismiss().then((params) => {
            this.native.modal = null;
            if (params.data) {
                if (params.data.delete) {
                    console.log('Deleting friend request', params);
                    this.invitationStateList = this.invitationStateList.filter(
                        (invite) => invite.friend.did !== params.data.did
                    );
                }
            }
        });
        return await this.native.modal.present();
    }
}
