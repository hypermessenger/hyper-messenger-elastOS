import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import { EventService } from './EventService';
import { FriendService } from './FriendService';
import { Friend } from '../models/friend.model';
import { Message } from '../models/message.model';
import { MessageDirection } from '../models/enums/message-direction.enum';
import { HiveService } from './HiveService';
import { FriendState } from '../models/enums/friend-state.enum';
import { MessageType } from '../models/enums/message-type.enum';
PouchDB.plugin(PouchFind);

let eventService: EventService = null;

@Injectable({
    providedIn: "root"
})
export class MessageService {
    private databaseMap = new Map<string, any>();
    private isChatActive: boolean = false;
    private activeDidInChat: string = "";
    private limit: number = 20;

    public selectingMessage = false; //TODO
    public pinningMessage = false;

    constructor(
        private eventServiceObject: EventService,
        private friendService: FriendService,
        private hiveService: HiveService
    ) {
        //console.log("MessageService - constructor");
        eventService = eventServiceObject;
    }

    async init() {
        //console.log("MessageService - init");
        let friendList = await this.friendService.getFriendList();
        friendList.forEach(friend => {
            this.createTenant(friend.did);
            this.syncMessagesFromHive(friend);
        });
    }

    async syncOfflineMessages() {
        console.log("debug - syncOfflineMessages");
        let friendList = await this.friendService.getFriendList();
        console.log("friendList");
        console.log(friendList);
        friendList.forEach(friend => {
            this.syncMessagesFromHive(friend);
        });
    }

    async syncMessagesFromHive(friend: Friend) {
        console.log("debug - syncMessagesFromHive - friend");
        console.log(friend);
        let lastMessage = await this.getLastMessage(friend.did);
        let lastTimestamp = 1;
        if (lastMessage != null) {
            lastTimestamp = lastMessage.timestamp;
        }

        let messageObjectList = await this.hiveService.findMany(friend.did, {"messageItem.timestamp": {$gt: lastTimestamp}});
        for (let messageObject of messageObjectList) {
            let messageItem = messageObject.messageItem as HivePlugin.JSONObject;
            let from = messageItem.from as string;
            let command = messageItem.command;
            if (command == "message") {
                let newMessage = Message.fromJsonObject(messageItem.message);
                await this.insertMessage(newMessage);
            }
            else if (command == "messageSeen") {
                if (friend.did == from) {
                    this.setSentMessagesSeen(from);
                }
                else {
                    this.setReceivedMessagesSeen(from, false);
                }
            }
            else if (command == "requestAccepted") {
                if (friend.did == from && friend.state == FriendState.PENDING) {
                    friend.state = FriendState.ACTIVE;
                    await this.friendService.updateFriend(friend);
                }
            }
        }
    }

    createTenant(did: string): void {
        if (!this.databaseMap.has(did)) {
            this.databaseMap.set(did, new PouchDB(did));

            this.databaseMap.get(did).info().then(response => {
                console.log("MessageService - info");
                console.log(response);
            });

            this.databaseMap.get(did).createIndex({
                index: {fields: ["value.timestamp", "value.direction", "value.isSeen"]}
            });

            this.databaseMap.get(did).changes({
                since: "now",
                live: true,
                include_docs: true
            }).on("change", change => {
                eventService.publishEvent("messageService:change:"+did, {response: true});
            });
        }
    }

    deleteTenant(did: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(did)) {
                let database = this.databaseMap.get(did);
                database.destroy().then(() => {
                    this.databaseMap.delete(did);
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
            }
        });
        
    }

    insertMessage(message: Message): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.did)) {
                let database = this.databaseMap.get(message.did);
                database.put({
                    _id: message.timestamp.toString(),
                    value: message
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
            }
        });
    }

    updateMessage(message: Message): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.did)) {
                let database = this.databaseMap.get(message.did);
                database.get(message.timestamp.toString(), {attachments: true}).then(doc => {
                    return database.put({
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message,
                        _attachments: doc._attachments
                    });
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
            }
        });
    }

    deleteMessage(message: Message): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(message.did)) {
                let database = this.databaseMap.get(message.did);
                database.get(message.timestamp.toString()).then(doc => {
                    return database.remove(doc);
                }).then(response => {
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
                this.hiveService.deleteOne(message.did, {"messageItem.timestamp": message.timestamp});
            }
        });
    }

    getMessageList(did: string): Promise<Message[]> {
        return new Promise((resolve, reject) => {
            var messageList: Message[] = [];
            if (this.databaseMap.has(did)) {
                let database = this.databaseMap.get(did);
                database.find({
                    selector: {},
                    limit: this.limit,
                    sort: [{"value.timestamp": "desc"}]
                }).then(response => {
                    let docs = response.docs;
                    for (var i = docs.length-1; i >= 0; i--) {
                        let doc = docs[i];
                        let message = Message.fromJsonObject(doc.value);
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

    getLastMessage(did: string): Promise<Message> {
        return new Promise((resolve, reject) => {
            var message: Message = null;
            if (this.databaseMap.has(did)) {
                let database = this.databaseMap.get(did);
                database.find({
                    selector: {},
                    limit: 1,
                    sort: [{"value.timestamp": "desc"}]
                }).then(response => {
                    if (response.docs.length > 0) {
                        message = Message.fromJsonObject(response.docs[0].value);
                    }
                    resolve(message);
                }).catch(error => {
                    resolve(null);
                });
            }
            else {
                resolve(null);
            }
        });
    }

    getUnseenReceivedMessageCount(did: string): Promise<number> {
        return new Promise((resolve, reject) => {
            var messageCount: number = 0;
            if (this.databaseMap.has(did)) {
                let database = this.databaseMap.get(did);
                database.find({
                    selector: {
                        "value.isSeen": false,
                        "value.direction": MessageDirection.RECEIVED
                    }
                }).then(response => {
                    let docs = response.docs;
                    messageCount = docs.length;
                    resolve(messageCount);
                }).catch(error => {
                    resolve(messageCount);
                });
            }
            else {
                resolve(messageCount);
            }
        });
    }

    setReceivedMessagesSeen(did: string, updateHive: boolean = true) {
        if (this.databaseMap.has(did)) {
            let database = this.databaseMap.get(did);
            database.find({
                selector: {
                    "value.isSeen": false,
                    "value.direction": MessageDirection.RECEIVED
                }
            }).then(async response => {
                let updateList: object[] = [];
                let docs = response.docs;
                docs.forEach(doc => {
                    let message = Message.fromJsonObject(doc.value);
                    message.isSeen = true;
                    let updateItem = {
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message,
                        _attachments: doc._attachments
                    };
                    updateList.push(updateItem);
                });
                database.bulkDocs(updateList);

                if (updateHive) {
                    let messageObjectList = await this.hiveService.findMany(did, 
                        {
                            "messageItem.message.isSeen": false,
                            "messageItem.message.direction": MessageDirection.RECEIVED
                        }
                    );
                    for (let messageObject of messageObjectList) {
                        this.hiveService.updateOne(did,
                            {
                                "messageItem.timestamp": (messageObject.messageItem as HivePlugin.JSONObject).timestamp
                            },
                            {
                                $set: {
                                    "messageItem.message.isSeen": true
                                }
                            }
                        );
                    }
                }
            });
        }
    }

    setSentMessagesSeen(did: string) {
        if (this.databaseMap.has(did)) {
            let database = this.databaseMap.get(did);
            database.find({
                selector: {
                    "value.isSeen": false,
                    "value.direction": MessageDirection.SENT
                }
            }).then(response => {
                let updateList: object[] = [];
                let docs = response.docs;
                docs.forEach(doc => {
                    let message = Message.fromJsonObject(doc.value);
                    message.isSeen = true;
                    let updateItem = {
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message,
                        _attachments: doc._attachments
                    };
                    updateList.push(updateItem);
                });
                database.bulkDocs(updateList);
            });
        }
    }

    setMessageFailure(did: string, timestamp: number) {
        if (this.databaseMap.has(did)) {
            let database = this.databaseMap.get(did);
            database.find({
                selector: {
                    "value.timestamp": timestamp
                }
            }).then(response => {
                console.log("setMessageFailure response");
                console.log(response);
                let updateList: object[] = [];
                let docs = response.docs;
                docs.forEach(doc => {
                    let message = Message.fromJsonObject(doc.value);
                    message.type = MessageType.FAILURE;
                    let updateItem = {
                        _id: message.timestamp.toString(),
                        _rev: doc._rev,
                        value: message,
                        _attachments: doc._attachments
                    };
                    updateList.push(updateItem);
                });
                database.bulkDocs(updateList);
            });
        }
    }

    deleteConversation(did: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.databaseMap.has(did)) {
                let database = this.databaseMap.get(did);
                database.destroy().then(response => {
                    this.databaseMap.delete(did);
                    this.createTenant(did);
                    eventService.publishEvent("messageService:change:"+did, {response: true});
                    this.hiveService.deleteMany(did);
                    resolve(true);
                }).catch(error => {
                    resolve(false);
                });
            }
            else {
                resolve(false);
            }
        });
    }

    getActiveDidInChat(): string {
        return this.activeDidInChat;
    }

    initUserInChat(did: string): void {
        this.isChatActive = true;
        this.activeDidInChat = did;
        this.limit = 20;
    }

    increaseLimit() {
        this.limit += 10;
    }

    resetChat() {
        this.isChatActive = false;
        this.activeDidInChat = "";
        this.limit = 20;
    }

}