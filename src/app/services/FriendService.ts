import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import { Friend } from '../models/friend.model';
import { EventService } from './EventService';
import { FriendState } from '../models/enums/friend-state.enum';
import { ConnectionState } from '../models/enums/connection-state.enum';
import { HiveUtil } from '../utils/HiveUtil';
import { HiveService } from './HiveService';
import { FriendDirection } from '../models/enums/friend-direction.enum';
PouchDB.plugin(PouchFind);

let eventService: EventService = null;

@Injectable({
    providedIn: "root"
})
export class FriendService {
    database: any;
    tempFriendMap = new Map<string, Friend>();

    constructor(
        private eventServiceObject: EventService,
        private hiveService: HiveService
    ) {
        //console.log("FriendService - constructor");
        eventService = eventServiceObject;
    }

    async init() {
        return new Promise(async (resolve, reject) => {
            //console.log("FriendService - init");
            this.database = new PouchDB("friend-db");
            
            this.database.info().then(async success => {
                console.log("FriendService - info");
                console.log(success);
                this.initIndexForSort();
                this.setFriendListOffline();
                this.database.changes({
                    since: "now",
                    live: true,
                    include_docs: true
                }).on("change", change => {
                    console.log("friend-db changed");
                    eventService.publishEvent("friendService:change", {response: true});
                });
                await this.hiveService.setFriendVaults(await this.getFriendList());
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    initIndexForSort() {
        this.database.createIndex({
            index: {fields: ["value.nickname"]}
        });

        this.database.createIndex({
            index: {fields: ["value.connectionState"]}
        });

        this.database.createIndex({
            index: {fields: ["value.nickname", "value.state"]}
        });

        this.database.createIndex({
            index: {fields: ["value.nickname", "value.connectionState"]}
        });

        this.database.createIndex({
            index: {fields: ["value.nickname", "value.state", "value.direction"]}
        });
    }

    async deleteDatabase(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.destroy().then(() => {
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    insertFriend(friend: Friend, updateHive: boolean = true): Promise<boolean> {
        console.log("FriendService - insertFriend");
        return new Promise((resolve, reject) => {
            this.database.put({
                _id: friend.did,
                value: friend
            }).then(async response => {
                if (updateHive) {
                    this.hiveService.insertOne(HiveUtil.FRIEND_COLLECTION, friend.toHiveObject());
                }
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    updateFriend(friend: Friend): Promise<boolean> {
        console.log("FriendService - updateFriend");
        return new Promise((resolve, reject) => {
            this.database.get(friend.did).then(doc => {
                return this.database.put({
                    _id: friend.did,
                    _rev: doc._rev,
                    value: friend
                });
            }).then(async response => {
                this.hiveService.updateOne(HiveUtil.FRIEND_COLLECTION, {did: friend.did}, {$set: friend.toHiveObject()});
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    deleteFriend(did: string): Promise<boolean> {
        console.log("FriendService - deleteFriend: "+did);
        return new Promise((resolve, reject) => {
            this.database.get(did).then(doc => {
                return this.database.remove(doc);
            }).then(async response => {
                eventService.publishEvent("friendService:change", {response: true});
                this.hiveService.deleteOne(HiveUtil.FRIEND_COLLECTION, {did: did});
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    getFriend(did: string): Promise<Friend> {
        return new Promise((resolve, reject) => {
            this.database.get(did).then(doc => {
                let friend: Friend = Friend.fromJsonObject(doc.value);
                resolve(friend);
            }).catch(error => {
                resolve(null);
            });
        });
    } 

    getFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {"value.nickname": {$gt: null}},
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    getNotPendingFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {
                    "value.nickname": {$gt: null},
                    "value.state": {$ne: FriendState.PENDING}
                },
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    getActiveFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {
                    "value.nickname": {$gt: null},
                    "value.state": FriendState.ACTIVE
                },
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                console.log(response);
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    getPendingReceivedFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {
                    "value.nickname": {$gt: null},
                    "value.state": FriendState.PENDING,
                    "value.direction": FriendDirection.RECEIVED
                },
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    getPendingSentFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {
                    "value.nickname": {$gt: null},
                    "value.state": FriendState.PENDING,
                    "value.direction": FriendDirection.SENT
                },
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    getOnlineFriendList(): Promise<Friend[]> {
        return new Promise((resolve, reject) => {
            let friendList: Friend[] = [];
            this.database.find({
                selector: {
                    "value.nickname": {$gt: null},
                    "value.connectionState": ConnectionState.ONLINE
                },
                sort: [{"value.nickname": "desc"}]
            }).then(response => {
                let docs = response.docs;
                for (var i = docs.length-1; i >= 0; i--) {
                    let doc = docs[i];
                    let friend: Friend = Friend.fromJsonObject(doc.value);
                    friendList.push(friend);
                }
                resolve(friendList);
            }).catch(error => {
                resolve(friendList);
            });
        });
    }

    setFriendListOffline() {
        this.database.find({
            selector: {"value.connectionState": ConnectionState.ONLINE}
        }).then(response => {
            console.log(response);
            let updateList: object[] = [];
            let docs = response.docs;
            docs.forEach(doc => {
                let friend: Friend = Friend.fromJsonObject(doc.value);
                friend.connectionState = ConnectionState.OFFLINE;
                let updateItem = {
                    _id: friend.did,
                    _rev: doc._rev,
                    value: friend
                };
                updateList.push(updateItem);
            });
            this.database.bulkDocs(updateList);
        }); 
    }

    addTempFriend(friend: Friend) {
        this.tempFriendMap.set(friend.userId, friend);
    }

    getTempFriend(userId: string): Friend {
        return this.tempFriendMap.get(userId);
    }
}