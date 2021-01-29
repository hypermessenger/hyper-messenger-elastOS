import { Component, OnInit, NgZone, ViewChild, OnDestroy } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Group } from 'src/app/models/group.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { EventService } from 'src/app/services/EventService';
import { GroupMessageDirection } from 'src/app/models/enums/group-message-direction.enum';
import { GroupMessage } from 'src/app/models/group-message.model';
import { Subscription } from 'rxjs';
import { GroupMessageService } from 'src/app/services/GroupMessageSerivce';
import { HiveService } from 'src/app/services/HiveService';
import { StorageService } from 'src/app/services/StorageService';
import { UIService } from 'src/app/services/ui.service';

@Component({
    selector: 'app-chat-group',
    templateUrl: './chat-group.page.html',
    styleUrls: ['./chat-group.page.scss'],
})
export class ChatGroupPage implements OnInit, OnDestroy {
    public myName = '';

    groupId: string;
    group: Group;
    message: string = "";
    messageList: GroupMessage[] = [];
    isSendDisabled: boolean = true;
    groupMessageSub: Subscription;
    name: string = "Anonymous";
    myDid: string;

    showEmojiPicker = false;

    @ViewChild(IonContent, {static: true}) content: IonContent;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private carrierService: CarrierService,
        private eventService: EventService,
        private groupMessageService: GroupMessageService,
        private hiveService: HiveService,
        private storageService: StorageService,
        private ngZone: NgZone,
        public UI: UIService
    ) {
        if (router.getCurrentNavigation().extras.state) {
            const data = router.getCurrentNavigation().extras.state;
            this.group = data.group;
            this.groupId = this.group.groupId;
        }
    }

    ngOnInit() {
        this.init();
    }

    ionViewWillEnter() {
        this.appService.setTitle(this.group.title);
        this.appService.setBack();
    }

    async init() {
        this.groupMessageService.initGroupInChat(this.group.groupId);
        await this.getSelfInfo();
        await this.drawChat();
        this.registerSubscribers();
    }

    ngOnDestroy() {
        this.groupMessageService.resetChat();
        this.unregisterSubscribers();
    }

    async getSelfInfo() {
        this.myName = await this.storageService.getProperty("name");
        this.myDid = await this.storageService.getProperty("did");
    }

    async drawChat() {
        this.messageList = await this.groupMessageService.getMessageList(this.groupId);
        this.scrollToBottom();
    }

    registerSubscribers() {
        this.groupMessageSub = this.eventService.getObservable("groupMessageService:change:"+this.groupId).subscribe((data: any) => {
            this.ngZone.run(() => {
                this.drawChat();
            });
        });
    }

    unregisterSubscribers() {
        this.groupMessageSub.unsubscribe();
    }

    isSent(direction: GroupMessageDirection): boolean {
        if (direction === GroupMessageDirection.SENT) {
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

    onSend() {
        if (this.message !== "") {
            const newMessage = new GroupMessage(new Date().valueOf(), this.group.groupId, this.myDid, this.myName, this.message, GroupMessageDirection.SENT, false);
            const messageObject: any = {
                command: "message",
                message: newMessage.toJsonObject()
            };
            this.carrierService.sendGroupMessage(this.group.groupId, messageObject);
            this.groupMessageService.insertMessage(newMessage);
            this.message = "";
        }
    }

    onInputChange(event) {
        if (event.detail.value === "") {
            this.isSendDisabled = true;
        } else {
            this.isSendDisabled = false;
        }
    }

    addEmoji(event) {
        this.message = this.message + event.data;
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.content.scrollToBottom) {
                this.content.scrollToBottom(150);
            }
        }, 200);
    }
}
