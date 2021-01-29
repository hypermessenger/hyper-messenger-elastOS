import { Component, OnInit, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { Message } from 'src/app/models/message.model';
import { MessageDirection } from 'src/app/models/enums/message-direction.enum';
import { MessageType } from 'src/app/models/enums/message-type.enum';
import { EventService } from 'src/app/services/EventService';
import { MessageService } from 'src/app/services/MessageService';
import { FriendService } from 'src/app/services/FriendService';
import { Friend } from 'src/app/models/friend.model';
import { ConnectionState } from 'src/app/models/enums/connection-state.enum';
import { Subscription } from 'rxjs';
import { PopoverController, IonContent, ModalController } from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { HiveService } from 'src/app/services/HiveService';
import { UIService } from 'src/app/services/ui.service';
import { StorageService } from 'src/app/services/StorageService';
import { MessageActionComponent } from 'src/app/components/message-action/message-action.component';
import { OptionsComponent } from 'src/app/components/options/options.component';
import { NativeService } from 'src/app/services/native.service';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
    selector: 'app-chat',
    templateUrl: './chat.page.html',
    styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
    public myName = '';
    public failureType = MessageType.FAILURE;

    friend: Friend;
    message: string = "";
    messageList: Message[] = [];
    isSendDisabled: boolean = true;
    messageSub: Subscription;
    friendSub: Subscription;
    fileSub: Subscription;

    showEmojiPicker = false;

    @ViewChild(IonContent, {static: true}) content: IonContent;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private carrierService: CarrierService,
        private eventService: EventService,
        private ngZone: NgZone,
        private messageService: MessageService,
        private friendService: FriendService,
        private popoverController: PopoverController,
        private modalController: ModalController,
        private hiveService: HiveService,
        public UI: UIService,
        private storageService: StorageService,
        private native: NativeService
    ) {
        if (router.getCurrentNavigation().extras.state) {
            const data = router.getCurrentNavigation().extras.state;
            this.friend = data.friend;
        }
    }

    ngOnInit() {
        this.init();
    }

    ionViewWillEnter() {
        console.log("ChatPage - ionViewWillEnter");
        this.appService.setTitle(this.friend.nickname);
        this.appService.setBack();
    }

    async init() {
        console.log("ChatPage - init");
        // this.setTitlebarIcon();
        this.messageService.initUserInChat(this.friend.did);
        this.getSelfInfo();
        this.drawChat();
        this.registerSubscribers();
    }

    ngOnDestroy() {
        this.messageService.resetChat();
        this.unregisterSubscribers();
    }

    setTitlebarIcon() {
        titleBarManager.addOnItemClickedListener((menuItem) => {
            if (menuItem.key === 'options') {
                this.onOptions();
            }
        });

        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.OUTER_RIGHT, {
            key: "options",
            iconPath: "assets/icon/threedots.png"
        });
    }

    async getSelfInfo() {
        this.myName = await this.storageService.getProperty("name");
    }

    async drawChat() {
        this.messageList = await this.messageService.getMessageList(this.friend.did);
        this.scrollToBottom();
    }

    registerSubscribers() {
        this.messageSub = this.eventService.getObservable("messageService:change:"+this.friend.did).subscribe((data: any) => {
            this.ngZone.run(() => {
                this.drawChat();
            });
        });
        this.friendSub = this.eventService.getObservable("carrier:onFriendConnection:"+this.friend.did).subscribe((data: any) => {
            this.friend.connectionState = data.connectionState;
        });
        this.fileSub = this.eventService.getObservable("carrier:fileTransfer").subscribe((data: any) => {
            if (data.command === "closePopup") {
                this.popoverController.dismiss();
            }
        });
    }

    unregisterSubscribers() {
        this.messageSub.unsubscribe();
        this.friendSub.unsubscribe();
        this.fileSub.unsubscribe();
    }

    isSent(direction: MessageDirection): boolean {
        if (direction === MessageDirection.SENT) {
            return true;
        }
        return false;
    }

    hasDate(i: number): boolean {
        if (i !== 0 && new Date(this.messageList[i].timestamp).toDateString() === new Date(this.messageList[i-1].timestamp).toDateString()) {
            return false;
        }
        return true;
    }

    getDate(timestamp: number): string {
        return new Date(timestamp).toDateString();
    }

    getTime(timestamp: number): string {
        return new Date(timestamp).toTimeString().substring(0, 5);
    }

    getType(messageType: MessageType): string {
        let type = "text";
        if (messageType == MessageType.FILE_TEMP) {
            type = "file_temp";
        }
        else if (messageType == MessageType.IMAGE) {
            type = "image";
        }
        else if (messageType == MessageType.VIDEO) {
            type = "video";
        }
        else if (messageType == MessageType.AUDIO) {
            type = "audio";
        }
        else if (messageType == MessageType.FAILURE) {
            type = "failure";
        }
        else if (messageType == MessageType.FILE) {
            type = "file";
        }
        return type;
    }

    async onSend() {
        if (this.message != "") {
            const newMessage = new Message(
                new Date().valueOf(),
                this.friend.did,
                this.message,
                MessageDirection.SENT,
                MessageType.TEXT,
                "null",
                false
            );
            let messageObject: any = {
                command: "message",
                message: newMessage.toJsonObject()
            };

            let insertReponse = await this.messageService.insertMessage(newMessage);
            if (insertReponse) {
                this.carrierService.sendFriendMessage(this.friend.did, messageObject);
            }
            this.message = "";
        }
    }

    onInputChange(event) {
        if (event.detail.value == "") {
            this.isSendDisabled = true;
        }
        else {
            this.isSendDisabled = false;
        }
    }

    async onMessageAction(event, message: Message) {
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: MessageActionComponent,
            cssClass: "messageActionModal",
            componentProps: {
                message: message
            }
        });
        this.native.modal.onWillDismiss().then(() => {
            this.native.modal = null;
        });
        return await this.native.modal.present();
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.content.scrollToBottom) {
                this.content.scrollToBottom(150);
            }
        }, 200);
    }

    async onRefresh(event) {
        this.messageService.increaseLimit();
        this.messageList = await this.messageService.getMessageList(this.friend.did);
        event.target.complete();
    }

    onAttachFile() {
        if (this.friend.connectionState === ConnectionState.ONLINE) {
            document.getElementById("fileInput").click();
        }
        else {
            this.appService.toast("Friend is offline.", ToastType.WARNING);
        }
    }

    async sendHelloMsg() {
        const newMessage = new Message(
            new Date().valueOf(),
            this.friend.did,
            'hello',
            MessageDirection.SENT,
            MessageType.TEXT,
            "null",
            false
        );
        const messageObject: any = {
            command: "message",
            message: newMessage.toJsonObject()
        };

        let insertResponse = await this.messageService.insertMessage(newMessage);
        if (insertResponse) {
            this.carrierService.sendFriendMessage(this.friend.did, messageObject);
        }
    }

    addEmoji(event) {
        this.message = this.message + event.data;
    }

    async onOptions() {
        await this.native.hidePopover();
        this.native.popover = await this.popoverController.create({
            mode: 'ios',
            component: OptionsComponent,
            componentProps: {
                type: 'chat',
            },
            cssClass: 'optionsComponent',
            translucent: false
        });
        this.native.popover.onWillDismiss().then(() => {
            this.native.popover = null;
        });
        return await this.native.popover.present();
    }
}