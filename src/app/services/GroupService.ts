import { Injectable } from '@angular/core';
import { EventService } from './EventService';
import PouchDB from 'pouchdb';
import { Group } from '../models/group.model';
import { HiveService } from './HiveService';
import { HiveUtil } from '../utils/HiveUtil';
import { FriendService } from './FriendService';

let eventService: EventService = null;

@Injectable({
    providedIn: "root"
})
export class GroupService {
    database: any;
    tempGroup: Group;

    public selectingGroup = false; //TODO
    public pinningGroup = false;

    constructor(
        private eventServiceObject: EventService,
        private hiveService: HiveService,
        private friendService: FriendService
    ) {
        //console.log("GroupService - constructor");
        eventService = eventServiceObject;
    }

    async init() {
        //console.log("GroupService - init");
        this.database = new PouchDB("group-db");

        this.database.info().then(success => {
            console.log("GroupService - info: "+JSON.stringify(success));
        });

        this.database.changes({
            since: "now",
            live: true,
            include_docs: true
        }).on("change", change => {
            //console.log("group-db changed");
            eventService.publishEvent("groupService:change", {response: true});
        });

        await this.hiveService.setGroupVaults(await this.getGroupList());
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

    insertGroup(group: Group): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.put({
                _id: group.groupId,
                value: group
            }).then(async response => {
                this.hiveService.insertOne(HiveUtil.GROUP_COLLECTION, group.toHiveObject());
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    updateGroup(group: Group): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.get(group.groupId).then(doc => {
                return this.database.put({
                    _id: group.groupId,
                    _rev: doc._rev,
                    value: group
                });
            }).then(async response => {
                this.hiveService.updateOne(HiveUtil.GROUP_COLLECTION, {groupId: group.groupId}, {$set: group.toHiveObject()});
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    deleteGroup(groupId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.get(groupId).then(doc => {
                return this.database.remove(doc);
            }).then(async response => {
                this.hiveService.deleteOne(HiveUtil.GROUP_COLLECTION, {groupId: groupId});
                resolve(true);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    getGroup(groupId: string): Promise<Group> {
        return new Promise((resolve, reject) => {
            this.database.get(groupId).then(doc => {
                let group: Group = Group.fromJsonObject(doc.value);
                resolve(group);
            }).catch(error => {
                resolve(null);
            });
        });
    }

    getGroupList(): Promise<Group[]> {
        return new Promise((resolve, reject) => {
            let groupList: Group[] = [];
            this.database.allDocs({
                include_docs: true,
                attachments: true
            }).then(response => {
                let rows = response.rows;
                rows.forEach(row => {
                    let group: Group = Group.fromJsonObject(row.doc.value);
                    groupList.push(group);
                });
                resolve(groupList);
            }).catch(error => {
                resolve(groupList);
            });
        });
    }

    setTempGroup(group: Group) {
        this.tempGroup = group;
    }

    getTempGroup(): Group {
        return this.tempGroup;
    }
}