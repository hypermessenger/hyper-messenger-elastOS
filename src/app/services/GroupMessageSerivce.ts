import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import { EventService } from './EventService';
import { GroupService } from './GroupService';
import { Group } from '../models/group.model';
import { GroupMessage } from '../models/group-message.model';
import { GroupMessageDirection } from '../models/enums/group-message-direction.enum';
import { GroupDirection } from '../models/enums/group-direction.enum';
import { HiveService } from './HiveService';
import { StorageService } from './StorageService';
import { GroupState } from '../models/enums/group-state.enum';
PouchDB.plugin(PouchFind);

let eventService: EventService = null;

@Injectable({
    providedIn: "root"
})
export class GroupMessageService {
    private databaseMap = new Map<string, any>();
    private isChatActive: boolean = false;
    private activeGroupIdInChat: string = "";
    private limit: number = 20;
    private myDid: string;

    constructor(
        private eventServiceObject: EventService,
        private groupService: GroupService,
        private hiveService: HiveService,
        private storageService: StorageService
    ) {
        //console.log("MessageService - constructor");
        eventService = eventServiceObject;
    }

    async init() {
        //console.log("MessageService - init");
        this.myDid = await this.storageService.getProperty("did");
        this.groupService.getGroupList().then((groupList: Group[]) => {
            groupList.forEach(async group => {
                await this.createTenant(group.groupId);
                this.syncMessagesFromHive(group);
            });
        });
    }

    async syncOfflineMessages() {
        let groupList = await this.groupService.getGroupList();
        groupList.forEach(group => {
            this.syncMessagesFromHive(group);
        });
    }

    async syncMessagesFromHive(group: Group) {
        console.log("debug - group syncMessagesFromHive");
        if (group.state == GroupState.ACTIVE) {
            let lastMessage = await this.getLastMessage(group.groupId);
            let lastTimestamp = 1;
            if (lastMessage != null) {
                lastTimestamp = lastMessage.timestamp;
            }

            if (group.direction == GroupDirection.SENT) {
                let messageObjectList = await this.hiveService.findMany(group.groupId, {"messageItem.timestamp": {$gt: lastTimestamp}});
                for (let messageObject of messageObjectList) {
                    let messageItem = messageObject.messageItem as HivePlugin.JSONObject;
                    let newMessage = GroupMessage.fromJsonObject(messageItem.message);
                    newMessage.direction = GroupMessageDirection.RECEIVED;
                    await this.insertMessage(newMessage);
                }
            }
            else {
                let groupMessageList = await this.hiveService.callScriptGetGroupMessageList(group.hostDid, group.groupId, lastTimestamp);
                for (let message of groupMessageList) {
                    if (message.did == this.myDid) {
                        message.direction = GroupMessageDirection.SENT;
                    }
                    else {
                        message.direction = GroupMessageDirection.RECEIVED;
                    }
                    await this.insertMessage(message);
                }
            }
        }
    }

    createTenant(groupId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
           if (!this.databaseMap.has(groupId)) {
                this.databaseMap.set(groupId, new PouchDB(groupId));

                this.databaseMap.get(groupId).info().then(response => {
                    console.log("GroupMessageService - info");
                    console.log(response);
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                })

                this.databaseMap.get(groupId).createIndex({
                    index: {fields: ["value.timestamp", "value.direction", "value.isSeen"]}
                });

                this.databaseMap.get(groupId).changes({
                    since: "now",
                    live: true,
                    include_docs: true
                }).on("change", change => {
                    eventService.publishEvent("groupMessageService:change:"+groupId, {response: true});
                });
            }
        });
    }

    deleteTenant(groupId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(groupId)) {
                let database = this.databaseMap.get(groupId);
                database.destroy().then(() => {
                    this.databaseMap.delete(groupId);
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
            }
        });
    }

    insertMessage(message: GroupMessage): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.groupId)) {
                let database = this.databaseMap.get(message.groupId);
                database.put({
                    _id: message.timestamp.toString(),
                    value: message
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    reject(error);
                });
            }
        });
    }

    updateMessage(message: GroupMessage): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.groupId)) {
                let database = this.databaseMap.get(message.groupId);
                database.get(message.timestamp.toString(), {attachments: true}).then(doc => {
                    return database.put({
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message
                    });
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    reject(error);
                });
            }
        });
    }

    deleteMessage(message: GroupMessage): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.groupId)) {
                let database = this.databaseMap.get(message.groupId);
                database.get(message.timestamp.toString()).then(doc => {
                    return database.remove(doc);
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    reject(error);
                });
            }
        });
    }

    getMessageList(groupId: string): Promise<GroupMessage[]> {
        return new Promise((resolve, reject) => {
            var messageList: GroupMessage[] = [];
            if (this.databaseMap.has(groupId)) {
                let database = this.databaseMap.get(groupId);
                database.find({
                    selector: {},
                    limit: this.limit,
                    sort: [{"value.timestamp": "desc"}]
                }).then(response => {
                    let docs = response.docs;
                    for (var i = docs.length-1; i >= 0; i--) {
                        let doc = docs[i];
                        let message = GroupMessage.fromJsonObject(doc.value);
                        messageList.push(message);
                    }
                    resolve(messageList);
                }).catch(error => {
                    resolve(messageList);
                });
            }
            else {
                resolve(messageList);
            }
        });
    }

    getLastMessage(groupId: string): Promise<GroupMessage> {
        return new Promise((resolve, reject) => {
            var message: GroupMessage = null;
            if (this.databaseMap.has(groupId)) {
                let database = this.databaseMap.get(groupId);
                database.find({
                    selector: {},
                    limit: 1,
                    sort: [{"value.timestamp": "desc"}]
                }).then(response => {
                    if (response.docs.length > 0) {
                        message = GroupMessage.fromJsonObject(response.docs[0].value);
                    }
                    resolve(message);
                }).catch(error => {
                    resolve(null);
                });
            }
            else{
                resolve(null);
            }
        });
    }

    getUnseenReceivedMessageCount(groupId: string): Promise<number> {
        return new Promise((resolve, reject) => {
            var messageCount: number = 0;
            if (this.databaseMap.has(groupId)) {
                let database = this.databaseMap.get(groupId);
                database.find({
                    selector: {
                        "value.isSeen": false,
                        "value.direction": GroupMessageDirection.RECEIVED
                    }
                }).then(response => {
                    let docs = response.docs;
                    messageCount = docs.length;
                    resolve(messageCount);
                }).catch(error => {
                    resolve(messageCount);
                });
            }
            else{
                resolve(messageCount);
            }
        });
    }

    setReceivedMessagesSeen(groupId: string): void {
        if (this.databaseMap.has(groupId)) {
            let database = this.databaseMap.get(groupId);
            database.find({
                selector: {
                    "value.isSeen": false,
                    "value.direction": GroupMessageDirection.RECEIVED
                }
            }).then(response => {
                let updateList: object[] = [];
                let docs = response.docs;
                docs.forEach(doc => {
                    let message = GroupMessage.fromJsonObject(doc.value);
                    message.isSeen = true;
                    let updateItem = {
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message
                    };
                    updateList.push(updateItem);
                });
                database.bulkDocs(updateList);
            });
        }
    }

    deleteConversation(groupId: string) {
        if (this.databaseMap.has(groupId)) {
            let database = this.databaseMap.get(groupId);
            database.destroy().then(response => {
                this.databaseMap.delete(groupId);
                this.createTenant(groupId);
                eventService.publishEvent("groupMessageService:change:"+groupId, {response: true});
            }).catch(error => {
                //console.log(error);
            });
        }
    }

    getActiveGroupIdInChat(): string {
        return this.activeGroupIdInChat;
    }

    initGroupInChat(groupId: string): void {
        this.isChatActive = true;
        this.activeGroupIdInChat = groupId;
        this.limit = 20;
    }

    increaseLimit() {
        this.limit += 10;
    }

    resetChat() {
        this.isChatActive = false;
        this.activeGroupIdInChat = "";
        this.limit = 20;
    }

}