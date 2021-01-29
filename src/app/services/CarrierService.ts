import { Injectable } from '@angular/core';
import { EventService } from './EventService';
import { Friend } from '../models/friend.model';
import { FriendService } from './FriendService';
import { FriendDirection } from '../models/enums/friend-direction.enum';
import { FriendState } from '../models/enums/friend-state.enum';
import { ConnectionState } from '../models/enums/connection-state.enum';
import { PresenceState } from '../models/enums/presence-state.enum';
import { MessageService } from './MessageService';
import { Message } from '../models/message.model';
import { MessageDirection } from '../models/enums/message-direction.enum';
import { MessageType } from '../models/enums/message-type.enum';
import { AppService } from './AppService';
import { GroupService } from './GroupService';
import { GroupState } from '../models/enums/group-state.enum';
import { GroupDirection } from '../models/enums/group-direction.enum';
import { Group } from '../models/group.model';
import { GroupMessage } from '../models/group-message.model';
import { GroupMessageDirection } from '../models/enums/group-message-direction.enum';
import { HiveService } from './HiveService';
import { GroupMessageService } from './GroupMessageSerivce';
import { StorageService } from './StorageService';
import { HiveUtil } from '../utils/HiveUtil';
import { BadgeType } from '../models/enums/badge-type.enum';
import { SentryErrorHandler } from '../app.module';

declare let carrierManager: CarrierPlugin.CarrierManager;
let carrierObject: CarrierPlugin.Carrier;
let eventService: EventService = null;
let friendService: FriendService = null;
let messageService: MessageService = null;
let groupService: GroupService = null;
let groupMessageService: GroupMessageService = null;
let hiveService: HiveService = null;
let storageService: StorageService = null;
let carrierService: CarrierService = null;
let appService: AppService = null;

let groupMap = new Map<string, CarrierPlugin.Group>(); //key: groupId
let didMap = new Map<string, string>(); //key: userId, value: did
let userIdMap = new Map<string, string>(); //key: did, value: userId
let onlineFriendMap = new Map<string, boolean>(); //key, did, value: isOnline

@Injectable({
    providedIn: "root"
})
export class CarrierService implements CarrierPlugin.CarrierCallbacks {
    private DEBUG = false;
    private static isCarrierConnected = false;
    public static friendList: string[] = [];

    private static opts = {
        udpEnabled: true,
        persistentLocation: "data",
        binaryUsed: false,
        expressEnabled: true
    };

    constructor(
        private eventServiceObject: EventService,
        private friendServiceObject: FriendService,
        private messageServiceObject: MessageService,
        private groupServiceObject: GroupService,
        private groupMessageServiceObject: GroupMessageService,
        private hiveServiceObject: HiveService,
        private storageServiceObject: StorageService,
        private appServiceObject: AppService
    ) {
        //console.log("CarrierService - constructor");
        eventService = eventServiceObject;
        friendService = friendServiceObject;
        messageService = messageServiceObject;
        groupService = groupServiceObject;
        groupMessageService = groupMessageServiceObject;
        hiveService = hiveServiceObject;
        storageService = storageServiceObject;
        appService = appServiceObject;
        carrierService = this;
    }

    isDebug(): boolean {
        return this.DEBUG;
    }

    isConnected(): boolean {
        return CarrierService.isCarrierConnected;
    }

    async init() {
        //console.log("CarrierService - init");
        let friendList = await friendService.getFriendList();
        for (let friend of friendList) {
            didMap.set(friend.userId, friend.did);
            userIdMap.set(friend.did, friend.userId);
            onlineFriendMap.set(friend.did, false);
        }

        if (!this.DEBUG) {
            carrierManager.createObject(this, CarrierService.opts,
                (carrier) => {
                    //console.log("CarrierService - createObject success");
                    carrierObject = carrier;

                    carrierObject.getGroups((groups: CarrierPlugin.Group[]) => {
                        console.log("group count: "+groups.length);
                        for (var i = 0; i < groups.length; i++) {
                            let group = groups[i];
                            console.log("groupId: "+group.groupId);
                            groupMap.set(group.groupId, group);
                        }
                        console.log("group map");
                        groupMap.forEach((value, key) => {
                            console.log("groupId: "+value.groupId);
                        });
                    }, error => {
                        console.log("getGroups error");
                        console.log(error);
                    });

                    carrierObject.start(50, null, null);
                },
                (error) => {
                    //console.log("CarrierService - createObject error");
                }
            );
        }
    }

    kill() {
        if (carrierObject) {
            carrierObject.destroy();
            carrierObject = null;
            CarrierService.isCarrierConnected = false;
        }
    }

    getAddress(): string {
        var address = "undefined";
        if (carrierObject) {
            address = carrierObject.address;
        }
        return address;
    }

    getUserId(): string {
        var userId = "undefined";
        if (carrierObject) {
            userId = carrierObject.userId;
        }
        return userId;
    }

    isFriendOnline(did: string): boolean {
        if (onlineFriendMap.has(did)) {
            return onlineFriendMap.get(did);
        }
        return false;
    }

    isValidAddress(address: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            carrierManager.isValidAddress(address, (isValid) => {
                resolve(isValid.valueOf());
            }, error => {
                resolve(false);
            });
        });
    }

    async addFriend(did: string, address: string, message: string, nickname: string): Promise<boolean> {
        console.log("addFriend");
        let resultList = await Promise.all([
            hiveService.callScriptGetUserData(did, "userId"),
            hiveService.callScriptGetUserData(did, "name")
        ]);
        let userId = resultList[0];
        let name = resultList[1];
        didMap.set(userId, did);
        userIdMap.set(did, userId);
        let newFriend = new Friend(did, address, userId, name, message, FriendDirection.SENT, FriendState.PENDING, ConnectionState.OFFLINE, PresenceState.AVAILABLE);
        friendService.addTempFriend(newFriend);
        return new Promise((resolve, reject) => {
            carrierObject.addFriend(address, message, () => {
                console.log("addFriend success");
                resolve(true);
            }, error => {
                resolve(false);
            });
        });
    }

    async restoreFriend(oldAddress: string, oldUserId: string, hiveFriend: Friend): Promise<boolean> {
        didMap.set(hiveFriend.userId, hiveFriend.did);
        userIdMap.set(hiveFriend.did, hiveFriend.userId);
        let messageObject: any = {
            command: "restoreFriend",
            did: await storageService.getProperty("did"),
            address: carrierService.getAddress(),
            userId: carrierService.getUserId(),
            oldAddress: oldAddress,
            oldUserId: oldUserId
        };
        let tempFriend = hiveFriend;
        tempFriend.state = FriendState.RESTORE;
        tempFriend.connectionState = ConnectionState.OFFLINE;
        tempFriend.presenceState = PresenceState.AVAILABLE;
        friendService.addTempFriend(tempFriend);
        
        return new Promise((resolve, reject) => {
            carrierObject.addFriend(hiveFriend.address, JSON.stringify(messageObject), () => {
                resolve(true);
            }, error => {
                resolve(false);
            });
        });
    }

    acceptFriend(did: string): Promise<boolean> {
        let userId = userIdMap.get(did);
        return new Promise((resolve, reject) => {
            carrierObject.acceptFriend(userId, () => {
                resolve(true);
            }, error => {
                resolve(false);
            });
        });
    }

    removeFriend(did: string): Promise<boolean> {
        const userId = userIdMap.get(did);
        return new Promise((resolve, reject) => {
            carrierObject.removeFriend(userId, () => {
                resolve(true);
            }, error => {
                resolve(false);
            });
        });
    }

    removeFriendByUserId(userId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            carrierObject.removeFriend(userId, () => {
                resolve(true);
            }, error => {
                resolve(false);
            });
        });
    }

    async sendFriendMessage(did: string, messageObject: any): Promise<boolean> {
        let userId = userIdMap.get(did);
        let myDid = await storageService.getProperty("did");
        messageObject.from = myDid;

        if (messageObject.command == "message") {
            messageObject.timestamp = messageObject.message.timestamp;
        }
        else {
            messageObject.timestamp = new Date().valueOf();
        }
        console.log(messageObject);
        return new Promise(async (resolve, reject) => {
            let isFriendOnline = this.isFriendOnline(did);
            if (isFriendOnline) {
                carrierObject.sendFriendMessage(userId, JSON.stringify(messageObject), () => {
                    console.log("sendFriendMessage success");
                }, error => {
                    console.log("sendFriendMessage error");
                    console.log(error);
                });
            }

            await hiveService.insertOne(did, {messageItem: messageObject});
            if (messageObject.command == "message") {
                messageObject.message.did = myDid;
                messageObject.message.direction = MessageDirection.RECEIVED;
            }
            let scriptInsertResponse = await hiveService.callScriptInsertMessage(did, messageObject);
            if (!scriptInsertResponse) {
                hiveService.deleteOne(did, {"messageItem.timestamp": messageObject.timestamp});
                messageService.setMessageFailure(did, messageObject.timestamp);
                resolve(false);
            }
            resolve(true);
        });
    }

    onFriends(paramObject) {
        console.log("CarrierService - onFriends");
        CarrierService.friendList = paramObject.friends;
    }

    onConnection(paramObject) {
        console.log("onConnection");

        let status: CarrierPlugin.ConnectionStatus = paramObject.status;
        //console.log("CarrierService - onConnection - "+status);
        console.log("CarrierService - address: "+carrierObject.address);
        console.log("CarrierService - userId: "+carrierObject.userId);
        if (status == CarrierPlugin.ConnectionStatus.CONNECTED) {
            CarrierService.isCarrierConnected = true;
        }
        else {
            CarrierService.isCarrierConnected = false;
        }
        eventService.publishEvent("carrier:onConnection", {response: "success"});
    }

    async onFriendConnection(paramObject) {
        let friendId: string = paramObject.friendId;
        let status: CarrierPlugin.ConnectionStatus = paramObject.status;
        let did = didMap.get(friendId);
        console.log("CarrierService - onFriendConnection - "+friendId+" - "+status);

        console.log("my address: "+carrierObject.address);
        console.log("my did: "+await storageService.getProperty("did"));

        let friend = await friendService.getFriend(did);
        if (friend != null) {
            if (friend.state == FriendState.PENDING || friend.state == FriendState.RESTORE) {
                friend.state = FriendState.ACTIVE;
            }
            if (status == CarrierPlugin.ConnectionStatus.CONNECTED) {
                onlineFriendMap.set(did, true);
                friend.connectionState = ConnectionState.ONLINE;
                messageService.syncMessagesFromHive(friend);
            }
            else {
                onlineFriendMap.set(did, false);
                friend.connectionState = ConnectionState.OFFLINE;
            }
            await friendService.updateFriend(friend);
            eventService.publishEvent("carrier:onFriendConnection:"+friend.userId, {connectionState: friend.connectionState});
        }
    }

    async onFriendRequest(paramObject) {
        console.log("onFriendRequest");
        let userId: string = paramObject.userId;
        let userInfo: CarrierPlugin.UserInfo = paramObject.userInfo;
        let hello: string = paramObject.hello;
        let messageObject: any = JSON.parse(hello);
        let did = messageObject.did;
        didMap.set(userId, did);
        userIdMap.set(did, userId);
        console.log(messageObject);

        if (messageObject.command == "newFriend") {
            let friend = await friendService.getFriend(did);
            if (friend == null) {
                await hiveService.addVault(did);
                let nickname = await hiveService.callScriptGetUserData(did, "name");
                let newFriend = new Friend(did, messageObject.address, userId, nickname, messageObject.message, FriendDirection.RECEIVED, FriendState.PENDING, ConnectionState.OFFLINE, PresenceState.AVAILABLE);
                let insertResponse = await friendService.insertFriend(newFriend);
                if (insertResponse) {
                    messageService.createTenant(did);
                }
                let request: NotificationManagerPlugin.NotificationRequest = {
                    key: did,
                    title: "Friend Request",
                    message: nickname + "has sent you a friend request."
                };
                appService.sendNotification(request);
                eventService.publishEvent("carrier:newBadge", {type: BadgeType.CONTACTS});
            }
            else {
                didMap.delete(friend.userId);
                friend.address = messageObject.address;
                friend.userId = messageObject.userId;
                await friendService.updateFriend(friend);
                await carrierService.removeFriendByUserId(messageObject.oldUserId);
                await carrierService.acceptFriend(did);
            }
        }
        else if (messageObject.command == "restoreFriend") {
            console.log("restoreFriend");
            didMap.delete(messageObject.oldUserId);
            let friend = await friendService.getFriend(messageObject.did);
            friend.address = messageObject.address;
            friend.userId = messageObject.userId;
            await friendService.updateFriend(friend);
            await carrierService.removeFriendByUserId(messageObject.oldUserId);
            await carrierService.acceptFriend(did);
        }
    }

    async onFriendAdded(paramObject) {
        console.log("CarrierService - onFriendAdded");
        let friendInfo: CarrierPlugin.FriendInfo = paramObject.friendInfo;
        let userId = friendInfo.userInfo.userId;
        let did = didMap.get(userId);
        
        let newFriend = friendService.getTempFriend(userId);
        if (newFriend != null && newFriend.userId == userId) {
            if (newFriend.state == FriendState.PENDING) {
                console.log("CarrierService - onFriendAdded - pending");
                let resultList = await Promise.all([
                    hiveService.createCollection(newFriend.did),
                    hiveService.addVault(newFriend.did),
                    hiveService.setScriptInsertMessage(newFriend.did)
                ]);
                let collectionResponse = resultList[0];
                let vaultResponse = resultList[1];
                let messageResponse = resultList[2];
                
                console.log("collectionResponse: "+collectionResponse);
                console.log("vaultResponse: "+vaultResponse);
                console.log("messageResponse: "+messageResponse);
                if (collectionResponse && vaultResponse && messageResponse) {
                    let insertResponse = await friendService.insertFriend(newFriend);
                    if (insertResponse) {
                        messageService.createTenant(newFriend.did);
                    }
                }
                else {
                    await carrierService.removeFriendByUserId(newFriend.userId);
                }
            }
            else if (newFriend.state == FriendState.RESTORE) {
                console.log("CarrierService - onFriendAdded - restore");
                newFriend.state = FriendState.ACTIVE;
                /*let insertResponse = await friendService.insertFriend(newFriend, false);
                if (insertResponse) {
                    messageService.createTenant(newFriend.did);
                    await hiveService.addVault(newFriend.did);
                    await messageService.syncMessagesFromHive(newFriend);
                }*/
                let resultList = await Promise.all([
                    hiveService.createCollection(newFriend.did),
                    hiveService.addVault(newFriend.did),
                    hiveService.setScriptInsertMessage(newFriend.did)
                ]);
                let collectionResponse = resultList[0];
                let vaultResponse = resultList[1];
                let messageResponse = resultList[2];
                
                console.log("collectionResponse: "+collectionResponse);
                console.log("vaultResponse: "+vaultResponse);
                console.log("messageResponse: "+messageResponse);
                if (collectionResponse && vaultResponse && messageResponse) {
                    let insertResponse = await friendService.insertFriend(newFriend);
                    if (insertResponse) {
                        messageService.createTenant(newFriend.did);
                        await messageService.syncMessagesFromHive(newFriend);
                    }
                }
                else {
                    await carrierService.removeFriendByUserId(newFriend.userId);
                }
            }
        }
        else {
            let friend = await friendService.getFriend(did);
            if (friend.state == FriendState.PENDING) {
                friend.state = FriendState.ACTIVE;
                let updateResponse = await friendService.updateFriend(friend);
                if (updateResponse) {
                    let jsonObject: any = {command: "requestAccepted"};
                    await Promise.all([
                        hiveService.createCollection(friend.did),
                        hiveService.addVault(friend.did),
                        hiveService.setScriptInsertMessage(friend.did),
                        carrierService.sendFriendMessage(friend.did, jsonObject)
                    ]);
                }
            }
        }
    }

    async onFriendRemoved(paramObject) {
        console.log("onFriendRemoved");
        let friendId: string = paramObject.friendId;
        let did = didMap.get(friendId);
        let friend = await friendService.getFriend(did);
        if (friend != null) {
            if (friend.state == FriendState.ACTIVE) {
                await messageService.deleteConversation(friend.did);
                await friendService.deleteFriend(friend.did);
            }
            else if (friend.state == FriendState.PENDING) {
                await friendService.deleteFriend(friend.did);
            }
            else if (friend.state == FriendState.REMOVED) {
                console.log("friend is removed");
                await messageService.deleteConversation(friend.did);
                await friendService.deleteFriend(friend.did);
            }
        }
        didMap.delete(friendId);
    }

    async onFriendMessage(paramObject) {
        let fromUserId: string = paramObject.from;
        let message: string = paramObject.message;
        let isOffline: Boolean = paramObject.isOffline;
        let did = didMap.get(fromUserId);
        console.log("message: "+message);
        
        try {
            let messageObject = JSON.parse(message);
            let command = messageObject.command;
            if (command == "message") {
                let newMessage = Message.fromJsonObject(messageObject.message);
                newMessage.did = did;
                newMessage.direction = MessageDirection.RECEIVED;
                let friend = await friendService.getFriend(did);
                if (friend != null) {
                    if (did == messageService.getActiveDidInChat()) {
                        newMessage.isSeen = true;
                        await messageService.insertMessage(newMessage);
                        let jsonObject: any = {command: "messageSeen"};
                        await carrierService.sendFriendMessage(did, jsonObject);
                    }
                    else {
                        await messageService.insertMessage(newMessage);
                        appService.notify(friend.nickname);
                    }
                    eventService.publishEvent("carrier:newBadge", {type: BadgeType.MESSAGES});
                    let request: NotificationManagerPlugin.NotificationRequest = {
                        key: did,
                        title: friend.nickname,
                        message: newMessage.text
                    };
                    appService.sendNotification(request);
                }
            }
            else if (command == "messageSeen") {
                messageService.setSentMessagesSeen(did);
            }
            else if (command == "groupInvite") {
                let group = await groupService.getGroup(messageObject.groupId);
                if (group == null) {
                    let newGroup = new Group(messageObject.groupId, messageObject.hostUserId, messageObject.hostDid, messageObject.title, GroupState.PENDING, GroupDirection.RECEIVED, messageObject.created, messageObject.modified);
                    newGroup.fromDid = did;
                    groupService.setTempGroup(newGroup);
                }
            }
            else if (command == "requestAccepted") {
                let friend = await friendService.getFriend(did);
                if (friend.state == FriendState.PENDING) {
                    friend.state = FriendState.ACTIVE;
                    await friendService.updateFriend(friend);
                }   
            }
        }
        catch (error) {}
    }


    /*** Group START ***/
    initGroups() {
        console.log("initGroups");
        carrierObject.getGroups((groups: CarrierPlugin.Group[]) => {
            console.log("group count: "+groups.length);
            for (var i = 0; i < groups.length; i++) {
                let group = groups[i];
                console.log("groupId: "+group.groupId);
                groupMap.set(group.groupId, group);
                
                /*carrierObject.groupLeave(groups[i], (group: CarrierPlugin.Group) => {
                    console.log("groupLeave success");
                }, error => {
                    console.log("groupLeave error");
                });*/
            }
            console.log("group map");
            groupMap.forEach((value, key) => {
                console.log("groupId: "+value.groupId);
            });
        }, error => {
            console.log("getGroups error");
            console.log(JSON.stringify(error));
        });
    }

    clearGroups() {
        console.log("clearGroups");
        groupMap.forEach((value, key) => {
            console.log("groupId: "+value.groupId);
            carrierObject.groupLeave(value, (group: CarrierPlugin.Group) => {
                console.log("groupLeave success");
            }, error => {
                console.log("groupLeave error");
            });
        });
    }

    printGroups() {
        console.log("printGroups");
        console.log(groupMap);
    }

    async onGroupInvite(paramObject) {
        console.log("onGroupInvite");
        var listPropertyNames = Object.keys(paramObject);
        console.log(listPropertyNames);
        //name,from,cookieCode,id,carrier

        let name: string = paramObject.name;
        let from: string = paramObject.from;
        let cookieCode: string = paramObject.cookieCode;
        let id: string = paramObject.id;

        console.log("onGroupInvite - name: "+name+", from: "+from+", cookieCode: "+cookieCode+", id: "+id);

        let tempGroup = groupService.getTempGroup();
        if (tempGroup != null) {
            tempGroup.cookie = cookieCode;
            await groupService.insertGroup(tempGroup);
            groupService.setTempGroup(null);
            let request: NotificationManagerPlugin.NotificationRequest = {
                key: from,
                title: "Group Invitation",
                message: "You have received a group invitation."
            };
            appService.sendNotification(request);
            eventService.publishEvent("carrier:newBadge", {type: BadgeType.GROUPS});
        }
    }

    createGroup(title: string): Promise<string> {
        console.log("createGroup");
        return new Promise((resolve, reject) => {
            carrierObject.newGroup(async (group: CarrierPlugin.Group) => {
                console.log("createGroup success");
                let userId = this.getUserId();
                let groupId = group.groupId.toString();
                groupMap.set(groupId, group);
                let myDid = await storageService.getProperty("did");
                let newGroup = new Group(groupId, userId, myDid, title, GroupState.ACTIVE, GroupDirection.SENT, new Date().valueOf(), new Date().valueOf());
                newGroup.fromDid = myDid;
                let insertResponse = await groupService.insertGroup(newGroup);
                if (insertResponse) {
                    groupMessageService.createTenant(newGroup.groupId);
                    await Promise.all([
                        hiveService.createCollection(groupId),
                        hiveService.addVault(newGroup.hostDid),
                        hiveService.setScriptInsertGroupMessage(newGroup.groupId),
                        hiveService.setScriptGetGroup(newGroup.groupId),
                        hiveService.setScriptGetGroupMessageList(newGroup.groupId)
                    ]);
                    resolve(groupId);
                }
                else {
                    resolve(null);
                }
            }, carrierError => {
                console.log(JSON.stringify(carrierError));
                resolve(null);
            });
        });
    }

    inviteToGroup(groupId: string, did: string): Promise<boolean> {
        console.log("inviteToGroup");
        return new Promise(async (resolve, reject) => {
            let userId = userIdMap.get(did);
            let group = await groupService.getGroup(groupId); 
            let jsonObject: any = {
                command: "groupInvite",
                groupId: group.groupId,
                hostUserId: group.hostUserId,
                hostDid: group.hostDid,
                title: group.title,
                created: group.groupCreated,
                modified: group.groupModified
            };
            let messageResponse = await carrierService.sendFriendMessage(did, jsonObject);
            if (messageResponse) {
                let carrierGroup = groupMap.get(groupId);
                carrierGroup.invite(userId, () => {
                    console.log("inviteToGroup success");
                    resolve(true);
                }, error => {
                    console.log("inviteToGroup error");
                    console.log(JSON.stringify(error));
                    resolve(false);
                });
            }
            else {
                resolve(false);
            }
        });
    }

    joinGroup(group: Group): Promise<boolean> {
        console.log("joinGroup");
        return new Promise(async (resolve, reject) => {
            let userId = userIdMap.get(group.fromDid);
            carrierObject.groupJoin(userId, group.cookie, async (carrierGroup: CarrierPlugin.Group) => {
                console.log("groupJoin success");
                let groupId = carrierGroup.groupId.toString();
                groupMap.set(groupId, carrierGroup);

                group.state = GroupState.ACTIVE;
                let updateResponse = await groupService.updateGroup(group);
                if (updateResponse) {
                    await groupMessageService.createTenant(group.groupId);
                    await hiveService.addVault(group.hostDid);
                    await groupMessageService.syncMessagesFromHive(group);
                    resolve(true);
                }
                resolve(false);
            }, error => {
                console.log("groupJoin error");
                console.log(JSON.stringify(error));
                resolve(false);
            });
        });
    }

    deleteGroup(group: Group): Promise<boolean> {
        console.log("deleteGroup - "+group.groupId);
        return new Promise(async (resolve, reject) => {
            if (group.state == GroupState.PENDING) {
                if (group.direction == GroupDirection.RECEIVED) {
                    await Promise.all([
                        groupService.deleteGroup(group.groupId),
                        groupMessageService.deleteTenant(group.groupId)
                    ]);
                    resolve(true);
                }
                else if (group.direction == GroupDirection.SENT) {
                    if (groupMap.has(group.groupId)) {
                        let carrierGroup = groupMap.get(group.groupId);
                        carrierObject.groupLeave(carrierGroup, async (carrierGroupPar: CarrierPlugin.Group) => {
                            console.log("groupLeave success");
                            await Promise.all([
                                groupService.deleteGroup(group.groupId),
                                groupMessageService.deleteTenant(group.groupId)
                            ]);
                            resolve(true);
                        }, error => {
                            console.log("groupLeave error");
                            console.log(error);
                            resolve(false);
                        });
                    }
                    else {
                        await Promise.all([
                            groupService.deleteGroup(group.groupId),
                            groupMessageService.deleteTenant(group.groupId)
                        ]);
                        resolve(true);
                    }
                }
            }
            else if (group.state == GroupState.ACTIVE) {
                if (groupMap.has(group.groupId)) {
                    let carrierGroup = groupMap.get(group.groupId);
                    carrierObject.groupLeave(carrierGroup, async (carrierGroupPar: CarrierPlugin.Group) => {
                        console.log("groupLeave success");
                        await Promise.all([
                            groupService.deleteGroup(group.groupId),
                            groupMessageService.deleteTenant(group.groupId)
                        ]);
                        resolve(true);
                    }, error => {
                        console.log("groupLeave error");
                        console.log(error);
                        resolve(false);
                    });
                }
                else {
                    await Promise.all([
                        groupService.deleteGroup(group.groupId),
                        groupMessageService.deleteTenant(group.groupId)
                    ]);
                    resolve(true);
                }
            }
        });
    }

    leaveGroup(groupId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (groupMap.has(groupId)) {
                let carrierGroup = groupMap.get(groupId);
                carrierObject.groupLeave(carrierGroup, (carrierGroupPar: CarrierPlugin.Group) => {
                    console.log("groupLeave success");
                    resolve(true);
                }, error => {
                    console.log("groupLeave error");
                    console.log(error);
                    resolve(false);
                });
            }
            resolve(false);
        });
    }

    leaveAllGroup(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            groupMap.forEach(async (value, key) => {
                await carrierService.leaveGroup(key);
            });
            resolve(true);
        });
    }

    setGroupTitle(group: Group): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let carrierGroup = groupMap.get(group.groupId);
            carrierGroup.setTitle(group.title, groupTitle => {
                console.log("carrier setTitle success");
                groupService.updateGroup(group).then(response => {
                    console.log("db setTitle success");
                    resolve(true);
                }).catch(dbError => {
                    reject(dbError);
                });
            }, carrierError => {
                reject(carrierError);
            });
        });
    }

    async sendGroupMessage(groupId: string, messageObject: any): Promise<boolean> {
        console.log("sendGroupMessage - "+groupId);
        if (groupMap.has(groupId)) {
            messageObject.from = await storageService.getProperty("did");
            messageObject.timestamp = messageObject.message.timestamp;
            
            console.log(JSON.stringify(messageObject));
            return new Promise(async (resolve, reject) => {
                let group = await groupService.getGroup(groupId);
                let carrierGroup = groupMap.get(groupId);
                carrierGroup.sendMessage(JSON.stringify(messageObject), () => {
                    console.log("group sendMessage success");
                }, error => {
                    console.log("group sendMessage error");
                    console.log(error);
                });
                
                if (group.hostDid == messageObject.from) {
                    await hiveService.insertOne(groupId, {messageItem: messageObject});
                }
                else {
                    await hiveService.callScriptInsertGroupMessage(group.hostDid, groupId, messageObject);
                }
                resolve(true);
            });
        }
    }

    getGroups() {
        console.log("getGroups");
        carrierObject.getGroups((groups: CarrierPlugin.Group[]) => {
            console.log("getGroups success");
            console.log("groupList: "+groups.length);
            for (var i = 0; i < groups.length; i++) {
                console.log(groups[i].groupId);
            }
        }, error => {
            console.log("getGroups error");
            console.log(JSON.stringify(error));
        });
    }

    hasGroupMember(groupId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            let carrierGroup = groupMap.get(groupId);
            carrierGroup.getPeers(async (peers: any) => {
                let memberCount = Object.keys(peers).length;
                if (memberCount > 1) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }, error => {
                resolve(false);
            });
        });
    }

    onGroupConnected(paramObject) {
        console.log("onGroupConnected");
        //var listPropertyNames = Object.keys(paramObject);
        //console.log(listPropertyNames);
    }

    async onGroupMessage(paramObject) {
        console.log("onGroupMessage");
        var listPropertyNames = Object.keys(paramObject);
        console.log(listPropertyNames);
        //name,from,message,groupId

        let name: string = paramObject.name;
        let from: string = paramObject.from;
        let message: string = paramObject.message;
        let groupId: string = paramObject.groupId;

        try {
            let userId = carrierService.getUserId();
            if (userId != from) {
                let messageObject = JSON.parse(message);
                let command = messageObject.command;
                if (command == "message") {
                    let newMessage = GroupMessage.fromJsonObject(messageObject.message);
                    newMessage.direction = GroupMessageDirection.RECEIVED;
                    let group = await groupService.getGroup(groupId);
                    if (group != null) {
                        if (groupId == groupMessageService.getActiveGroupIdInChat()) {
                            newMessage.isSeen = true;
                        }
                        else {
                            appService.notify(group.title);
                        }
                        await groupMessageService.insertMessage(newMessage);
                        eventService.publishEvent("carrier:newBadge", {type: BadgeType.GROUPS});
                        let request: NotificationManagerPlugin.NotificationRequest = {
                            key: groupId,
                            title: group.title,
                            message: newMessage.text
                        };
                        appService.sendNotification(request); 
                    }
                }
            }
        }
        catch (error) {}

        console.log("onGroupMessage - name: "+name+", from: "+from+", message: "+message+", groupId: "+groupId);
    }

    async onGroupTitle(paramObject) {
        console.log("onGroupTitle");
        var listPropertyNames = Object.keys(paramObject);
        console.log(listPropertyNames);

        let groupId = paramObject.groupId;
        let title = paramObject.title;

        let group = await groupService.getGroup(groupId);
        if (group != null) {
            group.title = paramObject.title;
            await groupService.updateGroup(group);
        }
    }

    onPeerName(paramObject) {
        console.log("onPeerName");
        var listPropertyNames = Object.keys(paramObject);
        console.log(listPropertyNames);
    }

    onPeerListChanged(paramObject) {
        console.log("onPeerListChanged");
        var listPropertyNames = Object.keys(paramObject);
        console.log(listPropertyNames);
        //name,groupId
    }
    /*** Group END ***/
}