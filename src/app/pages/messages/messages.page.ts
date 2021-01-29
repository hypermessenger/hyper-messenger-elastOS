import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { EventService } from 'src/app/services/EventService';
import { Friend } from 'src/app/models/friend.model';
import { FriendService } from 'src/app/services/FriendService';
import { Subscription } from 'rxjs';
import { MenuController, PopoverController, AlertController } from '@ionic/angular';
import { Tab } from '../tabs/tabs';
import { FriendState } from 'src/app/models/enums/friend-state.enum';
import { MessageService } from 'src/app/services/MessageService';
import { ConnectionState } from 'src/app/models/enums/connection-state.enum';
import { Message } from 'src/app/models/message.model';
import { MessageDirection } from 'src/app/models/enums/message-direction.enum';
import { NavigationExtras, Router } from '@angular/router';
import { NativeService } from 'src/app/services/native.service';
import { UIService } from 'src/app/services/ui.service';
import { AppService } from 'src/app/services/AppService';
import { Avatar, TempAvatar } from 'src/app/models/avatar.model';
import { OptionsComponent } from 'src/app/components/options/options.component';
import { ToastType } from 'src/app/models/enums/toast-type.enum';

export type UIState = {
    friend: Friend,
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
    stateColor: string,
    isOnline: boolean
};

@Component({
    selector: 'app-messages',
    templateUrl: './messages.page.html',
    styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit, OnDestroy, Tab {


    slideOpts = {
        initialSlide: 0,
        speed: 200,
        zoom: true,
        slidesPerView: 5.5
    };

    hasMessage: boolean = false;
    friendList: Friend[] = [];
    stateList: UIState[] = [];
    friendSub: Subscription;
    messageSubMap = new Map<string, Subscription>(); //key: friendId
    isSubActive = false;

    popover = null;
    alert = null;

    constructor(
        private appService: AppService,
        private carrierService: CarrierService,
        private eventService: EventService,
        private ngZone: NgZone,
        private router: Router,
        private friendService: FriendService,
        public messageService: MessageService,
        private menuController: MenuController,
        private popoverController: PopoverController,
        private alertController: AlertController,
        public native: NativeService,
        public UI: UIService
    ) {}

    ionViewWillEnter() {
        if (this.carrierService.isConnected()) {
            this.appService.setWhiteBackground();
        }
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

    async ngOnInit() {
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
        this.messageSubMap.forEach((value, key) => {
            value.unsubscribe();
        });
        this.messageSubMap.clear();
    }

    async setFriendList() {
        this.friendList = await this.friendService.getNotPendingFriendList();
        this.setMessageVisibility(this.friendList.length);
        await this.setFriendState();
    }

    setMessageVisibility(count: number) {
        if (count > 0) {
            this.hasMessage = true;
        } else {
            this.hasMessage = false;
        }
    }

    async setFriendState() {
        for (let i = 0; i < this.friendList.length; i++) {
            const tempState: UIState = {
                friend: this.friendList[i],
                avatar: null,
                tempAvatar: {
                    color: this.UI.getColor(),
                    initial: this.UI.getInitials(this.friendList[i].nickname),
                },
                isVisible: true,
                isBold: false,
                isSeen: false,
                isReceived: true,
                messageText: null,
                messageCount: null,
                date: null,
                dateTime: null,
                stateColor: null,
                isOnline: false
            };

            if (this.friendList[i].connectionState == ConnectionState.ONLINE) {
                tempState.stateColor = "state-online";
                tempState.isOnline = true;
            }
            else {
                tempState.stateColor = "state-offline";
                tempState.isOnline = false;
            }

            const message: Message = await this.messageService.getLastMessage(this.friendList[i].did);
            if (message == null) {
                tempState.messageText = "Start a conversation.";
                tempState.isVisible = false;
                tempState.isBold = false;
            }
            else {
                tempState.messageCount = 0;
                let text = "";
                if (message.direction == MessageDirection.SENT) {
                    tempState.isSeen = message.isSeen;
                    text = "You: "+message.text;
                    tempState.isReceived = false;
                    tempState.isBold = false;
                }
                else if (message.direction == MessageDirection.RECEIVED) {
                    const count = await this.messageService.getUnseenReceivedMessageCount(this.friendList[i].did);
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

                    text = message.text;
                    tempState.isReceived = true;
                }
                tempState.messageText = text;
                tempState.date = new Date(message.timestamp).getTime();
                tempState.dateTime = new Date(message.timestamp).toTimeString().substring(0, 5);
                tempState.isVisible = true;
            }
            this.stateList[i] = tempState;
            
            if (!this.messageSubMap.has(this.friendList[i].did)) {
                let messageSub = this.eventService.getObservable("messageService:change:"+this.friendList[i].did).subscribe((data: any) => {
                    this.ngZone.run(async () => {
                        await this.setFriendList();
                    });
                });
                this.messageSubMap.set(this.friendList[i].did, messageSub);
            }
        }
        if (this.stateList.length > this.friendList.length) {
            this.stateList = this.stateList.slice(0, this.friendList.length);
        }

        //this.stateList = this.stateList.sort((a, b) => a.date > b.date ? -1 : 1);
        //this.stateList = this.stateList.sort((a, b) => a.date > b.date ? 1 : -1);
    }

    onMenu() {
        this.menuController.toggle("sideMenu");
    }

    async onCard(index) {
        if (this.stateList[index].messageCount > 0) {
            let messageObject: any = {command: "messageSeen"};
            this.carrierService.sendFriendMessage(this.friendList[index].did, messageObject);
            this.messageService.setReceivedMessagesSeen(this.friendList[index].did);
        }

        let navExtras: NavigationExtras = {
            state: {
                friend: this.friendList[index]
            }
        };
        this.router.navigate(["/chat"], navExtras);
    }

    async onOptions(ev: any) {
        await this.native.hidePopover();
        this.native.popover = await this.popoverController.create({
            mode: 'ios',
            component: OptionsComponent,
            componentProps: {
                type: 'message',
            },
            cssClass: 'optionsComponent',
            event: ev,
            translucent: false
        });
        this.native.popover.onWillDismiss().then(() => {
            this.native.popover = null;
        });
        return await this.native.popover.present();
    }

    async onDelete(friend: Friend) {
        await this.native.hideAlert();
        this.native.alert = await this.alertController.create({
            header: "Delete Conversation",
            message: "This message with " + friend.nickname + " will be permanently deleted. Are you sure you want to continue?",
            buttons: [
                {
                    text: "Cancel",
                    role: "cancel"
                },
                {
                    text: "Confirm",
                    handler: async () => {
                        this.messageService.deleteConversation(friend.did);
                        this.appService.toast("Conversation has been deleted.", ToastType.SUCCESS);
                    }
                }
            ]
        });
        this.native.alert.onWillDismiss().then(() => {
            this.native.alert = null;
        });
        await this.native.alert.present();
    }

    isRemoved(state: FriendState) {
        if (state === FriendState.REMOVED) {
            return true;
        }
        return false;
    }
}
