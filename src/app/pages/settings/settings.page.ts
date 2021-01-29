import { Component, NgZone, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { HiveService } from 'src/app/services/HiveService';
import { StorageService } from 'src/app/services/StorageService';
import { FriendService } from 'src/app/services/FriendService';
import { Friend } from 'src/app/models/friend.model';
import { HiveUtil } from 'src/app/utils/HiveUtil';
import { Message } from 'src/app/models/message.model';
import { MessageDirection } from 'src/app/models/enums/message-direction.enum';
import { MessageType } from 'src/app/models/enums/message-type.enum';
import { GroupService } from 'src/app/services/GroupService';
import { GroupMessageService } from 'src/app/services/GroupMessageSerivce';
import { MessageService } from 'src/app/services/MessageService';
import { FriendDirection } from 'src/app/models/enums/friend-direction.enum';
import { FriendState } from 'src/app/models/enums/friend-state.enum';
import { ConnectionState } from 'src/app/models/enums/connection-state.enum';
import { PresenceState } from 'src/app/models/enums/presence-state.enum';
import { NativeService } from 'src/app/services/native.service';

declare let appManager: AppManagerPlugin.AppManager;

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
    constructor(
        private appService: AppService,
        private carrierService: CarrierService,
        private clipboard: Clipboard,
        private hiveService: HiveService,
        private storageService: StorageService,
        private ngZone: NgZone,
        private friendService: FriendService,
        private groupService: GroupService,
        private messageService: MessageService,
        private groupMessageService: GroupMessageService,
        private native: NativeService
    ) {}

    ngOnInit() {
        console.log("SettingsPage - ngOnInit");
    }
    
    async clearLocalData() {
        await this.appService.showSpinner();
        let friendList = await this.friendService.getFriendList();
        for (let friend of friendList) {
            this.messageService.deleteTenant(friend.did);
        }
        this.friendService.deleteDatabase();

        let groupList = await this.groupService.getGroupList();
        for (let group of groupList) {
            this.groupMessageService.deleteTenant(group.groupId);
        }
        this.groupService.deleteDatabase();
        this.storageService.deleteDatabase();
        this.appService.hideSpinner();
    }

    ionViewWillEnter() {
        this.appService.setTitle("Settings");
        this.appService.setBack();
    }

    async test() {
        //this.native.go("/publish-did");
        /*let friend = (await this.friendService.getActiveFriendList())[0];
        await this.messageService.deleteTenant(friend.did);
        this.messageService.createTenant(friend.did);*/
        await this.hiveService.deleteMany(HiveUtil.GROUP_COLLECTION);
        await this.hiveService.deleteMany(HiveUtil.FRIEND_COLLECTION);
        await this.hiveService.deleteMany(HiveUtil.SELF_DATA_COLLECTION);
    }

    async test2() {
        let group = (await this.groupService.getGroupList())[0];
        console.log(group);
        let groupMessageList = await this.hiveService.callScriptGetGroupMessageList(group.hostDid, group.groupId, 1);
        console.log(groupMessageList);
    }

    async createFriend() {
        console.log("SettingsPage - createFriend");
        let newFriend = new Friend(
            "testDid",
            "testAddress",
            "testUserId",
            "Friend1",
            "hi, add me",
            FriendDirection.SENT,
            FriendState.ACTIVE,
            ConnectionState.ONLINE,
            PresenceState.AVAILABLE
        );
        await this.friendService.insertFriend(newFriend);
        await this.messageService.createTenant(newFriend.did);
    }

    async createMessage() {
        console.log("SettingsPage - createMessage");
        let sentMessage = new Message(
            new Date().valueOf(),
            "testDid",
            "sentMessageText",
            MessageDirection.SENT,
            MessageType.TEXT,
            null,
            false
        );
        await this.messageService.insertMessage(sentMessage);

        let receivedMessage = new Message(
            new Date().valueOf(),
            "testDid",
            "receivedMessageText",
            MessageDirection.RECEIVED,
            MessageType.TEXT,
            null,
            false
        );
        await this.messageService.insertMessage(receivedMessage);
    }

    async getUserData() {
        console.log("getUserData");
        let allData = await this.hiveService.findMany(HiveUtil.SELF_DATA_COLLECTION);
        console.log(allData);
    }

    async setScriptGetUserData() {
        console.log("setScriptGetUserData");
        await this.hiveService.setScriptGetUserData();
        //await this.hiveService.setScriptGetAllUserData();
    }

    async getFriendList() {
        console.log("getFriendList");
        let hiveFriendList = HiveUtil.getFriendList(await this.hiveService.findMany(HiveUtil.FRIEND_COLLECTION));
        let localFriendList = await this.friendService.getFriendList();
        console.log("Hive friendList");
        console.log(hiveFriendList);
        console.log("Local friendList");
        console.log(localFriendList);
        console.log("Carrier friendList");
        console.log(CarrierService.friendList);
        for (let userId of CarrierService.friendList) {
            console.log("carrier friend userId: "+userId);
        }
    }

    async clearFriendList() {
        console.log("clearFriendList");
        let friendList = await this.friendService.getFriendList();
        for (let friend of friendList) {
            await this.carrierService.removeFriend(friend.did);
            await this.friendService.deleteFriend(friend.did);
        }
    }

    async getGroupList() {
        console.log("SettingsPage - getGroupList");
        let hiveGroupList = await this.hiveService.findMany(HiveUtil.GROUP_COLLECTION);
        let localGroupList = await this.groupService.getGroupList();
        console.log("Hive groupList");
        console.log(hiveGroupList);
        console.log("Local groupList");
        console.log(localGroupList);
        this.carrierService.printGroups();
    }

    async setScriptGetGroupMessageList() {
        console.log("SettingsPage - setScriptGetGroupMessageList");
        let group = (await this.groupService.getGroupList())[0];
        this.hiveService.setScriptGetGroupMessageList(group.groupId);
    }

    async getGroupMessageList() {
        console.log("SettingsPage - getGroupMessageList");
        let group = (await this.groupService.getGroupList())[0];
        if (group.hostUserId == this.carrierService.getUserId()) {
            let messageList = await this.hiveService.findMany(group.groupId, {"messageItem.timestamp": {$gt: 1605779023616}});
            console.log(messageList);
        }
        else {
            let messageList = await this.hiveService.callScriptGetGroupMessageList(group.hostDid, group.groupId, 1605779023616);
            console.log(messageList);
        }
    }

    async clearGroupList() {
        console.log("SettingsPage - clearGroupList");
        await this.hiveService.deleteMany(HiveUtil.GROUP_COLLECTION);
        this.carrierService.clearGroups();
        let groupList = await this.groupService.getGroupList();
        console.log(groupList);
        for (let group of groupList) {
            this.groupService.deleteGroup(group.groupId);
        }
    }

    async clearSelfData() {
        console.log("SettingsPage - clearSelfData");
        await this.hiveService.deleteMany(HiveUtil.SELF_DATA_COLLECTION);
    }

}
