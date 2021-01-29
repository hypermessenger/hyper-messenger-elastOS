import { Injectable } from '@angular/core';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { SentryErrorHandler } from '../app.module';
import { Friend } from '../models/friend.model';
import { GroupMessage } from '../models/group-message.model';
import { Group } from '../models/group.model';
import { HiveUtil } from '../utils/HiveUtil';
import { StorageService } from './StorageService';

declare let hiveManager: HivePlugin.HiveManager;

@Injectable({
    providedIn: "root"
})
export class HiveService {
    public static isInitialized: boolean = false;
    private hiveAuthHelper: TrinitySDK.Hive.AuthHelper;
    private client: HivePlugin.Client;
    private selfVault: HivePlugin.Vault;
    private selfVaultOwnerDid = null;
    private vaultMap: Map<string, HivePlugin.Vault> = new Map<string, HivePlugin.Vault>();
    
    constructor(
        private storageService: StorageService,
        private sentry: SentryErrorHandler
    ) {
        console.log("HiveService - constructor");
    }

    async init() {
        console.log("HiveService - init");
        let did = await this.storageService.getProperty("did");
        if (did != null && !HiveService.isInitialized) {
            try {
                this.selfVaultOwnerDid = did;
                this.hiveAuthHelper = new TrinitySDK.Hive.AuthHelper();
                this.client = await this.hiveAuthHelper.getClientWithAuth((error) => {
                    console.log("HiveService - getClientWithAuth error");
                    console.log(error);
                    this.sentry.notify(error);
                    HiveService.isInitialized = false;
                    return;
                });
                
                console.log("selfVaultOwnerDid: "+this.selfVaultOwnerDid);
                this.selfVault = await this.client.getVault(this.selfVaultOwnerDid);
                if (this.selfVault) {
                    console.log("vault is not null");
                    console.log("Found vault address: "+this.selfVault.getVaultProviderAddress());
                    await Promise.all([
                        this.createCollection(HiveUtil.FRIEND_COLLECTION),
                        this.createCollection(HiveUtil.GROUP_COLLECTION),
                        this.createCollection(HiveUtil.SELF_DATA_COLLECTION)
                    ]);
                    HiveService.isInitialized = true;
                }
                else {
                    console.log("vault is null");
                    console.log("No vault address found!");
                    this.sentry.notify("no vault address with did: "+this.selfVaultOwnerDid);
                    HiveService.isInitialized = false;
                }
            }
            catch (e) {
                console.log("HiveService - init - error");
                console.log(e);
                this.sentry.notify(e);
            }
        }
        else {
            HiveService.isInitialized = false;
        }
    }

    async setFriendVaults(friendList: Friend[]) {
        console.log("HiveService - setFriendVaults");
        for (let friend of friendList) {
            console.log("friend.did: "+friend.did);
            this.addVault(friend.did);
        }
    }

    async setGroupVaults(groupList: Group[]) {
        console.log("HiveService - setGroupVaults");
        for (let group of groupList) {
            console.log("group.hostdid: "+group.hostDid);
            this.addVault(group.hostDid);
        }
    }

    async addVault(did: string): Promise<boolean> {
        console.log("HiveService - addVault");
        return new Promise(async (resolve, reject) => {
            if (!this.vaultMap.has(did)) {
                try {
                    let vault = await this.client.getVault(did);
                    this.vaultMap.set(did, vault);
                    resolve(true);
                }
                catch (e) {
                    console.log("HiveService - addVault - error with did: "+did);
                    console.log(e);
                    this.sentry.notify(e);
                    resolve(false);
                }
            }
            resolve(true);
        });
    }

    async setScriptInsertMessage(did: string): Promise<boolean> {
        console.log("HiveService - setScriptInsertMessage - did: "+did);
        return new Promise(async (resolve, reject) => {
            let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
                hiveManager.Scripting.Executables.Database.newInsertQuery(did, {messageItem: "$params.messageItem"}, {}, true, "insertMessage")
            ]);
            let accessCondition = hiveManager.Scripting.Conditions.Database.newQueryHasResultsCondition(HiveUtil.FRIEND_COLLECTION, {did: "$caller_did"}, "isFriend");
            let wasCreated = await this.selfVault.getScripting().setScript("callScriptInsertMessage", executionSequence, accessCondition);
            if (wasCreated) {
                console.log("HiveService - setScriptInsertMessage - success");
                resolve(true);
            }
            else {
                console.log("HiveService - setScriptInsertMessage - failure");
                this.sentry.notify("HiveService - setScriptInsertMessage - failure - "+did);
                resolve(false);
            }
        });
    }

    async callScriptInsertMessage(did: string, document: HivePlugin.JSONObject): Promise<boolean> {
        console.log("HiveSerivce - callScriptInsertMessage - did: "+did);
        return new Promise(async (resolve, reject) => {
            try {
                if (this.vaultMap.has(did)) {
                    let vault = this.vaultMap.get(did);
                    let scriptResult = await vault.getScripting().call("callScriptInsertMessage", {
                        messageItem: document
                    });
                    console.log("HiveService - scriptResult");
                    console.log(scriptResult);
                    resolve(true);
                }
                resolve(false);
            }
            catch(e) {
                console.log("HiveService - callScriptInsertMessage error");
                console.log(e);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async setScriptInsertGroupMessage(groupId: string) {
        console.log("HiveService - setScriptInsertGroupMessage - groupId: "+groupId);
        let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
            hiveManager.Scripting.Executables.Database.newInsertQuery(groupId, {messageItem: "$params.messageItem"}, {}, true, "insertGroupMessage")
        ]);
        //let accessCondition = hiveManager.Scripting.Conditions.Database.newQueryHasResultsCondition(HiveUtil.FRIEND_COLLECTION, {did: "$caller_did"});
        let wasCreated = await this.selfVault.getScripting().setScript("callScriptInsertGroupMessage", executionSequence/*, accessCondition*/);
        if (wasCreated) {
            console.log("HiveService - setScriptInsertGroupMessage - success");
        }
        else {
            console.log("HiveService - setScriptInsertGroupMessage - failure");
            this.sentry.notify("HiveService - setScriptInsertGroupMessage - failure - did: "+this.selfVaultOwnerDid+", groupId: "+groupId);
        }
    }

    async callScriptInsertGroupMessage(did: string, groupId: string, document: HivePlugin.JSONObject) {
        console.log("HiveSerivce - callScriptInsertGroupMessage - groupId: "+groupId);
        if (this.vaultMap.has(did)) {
            let vault = this.vaultMap.get(did);
            let scriptResult = await vault.getScripting().call("callScriptInsertGroupMessage", {
                messageItem: document
            });
            console.log("HiveService - scriptResult: "+scriptResult);
            console.log(JSON.stringify(scriptResult));
        }
    }

    async setScriptGetGroup(groupId: string) {
        console.log("HiveService - setScriptGetGroup - groupId: "+groupId);
        let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
            hiveManager.Scripting.Executables.Database.newFindOneQuery(HiveUtil.GROUP_COLLECTION, {groupId: "$params.groupId"}, {}, true, "getGroup")
        ]);
        //let accessCondition = hiveManager.Scripting.Conditions.Database.newQueryHasResultsCondition(HiveUtil.FRIEND_COLLECTION, {did: "$caller_did"});
        let wasCreated = await this.selfVault.getScripting().setScript("callScriptGetGroup", executionSequence/*, accessCondition*/);
        if (wasCreated) {
            console.log("HiveService - setScriptGetGroup - success");
        }
        else {
            console.log("HiveService - setScriptGetGroup - failure");
            this.sentry.notify("HiveService - setScriptGetGroup - failure - did: "+this.selfVaultOwnerDid+", groupId: "+groupId);
        }
    }

    async callScriptGetGroup(did: string, groupId: string): Promise<Group> {
        console.log("HiveSerivce - callScriptGetGroup - groupId: "+groupId);
        let group: Group = null;
        if (this.vaultMap.has(did)) {
            console.log("has group in vault");
            let vault = this.vaultMap.get(did);
            let scriptResult = await vault.getScripting().call("callScriptGetGroup", {
                groupId: groupId
            });
            console.log("HiveService - scriptResult:");
            console.log(scriptResult);
            let getGroup = scriptResult.getGroup as HivePlugin.JSONObject;
            let items = getGroup.items as HivePlugin.JSONObject[];
            if (items[0] != null) {
                group = Group.fromHiveObject(items[0]);
            }
        }
        return group;
    }

    async setScriptGetGroupMessageList(groupId: string) {
        console.log("HiveService - setScriptGetGroup - groupId: "+groupId);
        let scriptName = "callScriptGetGroupMessageList_" + groupId;
        let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
            hiveManager.Scripting.Executables.Database.newFindManyQuery(groupId, {"messageItem.timestamp": {$gt: "$params.timestamp"}}, {}, true, "getGroupMessageList")
        ]);
        //let accessCondition = hiveManager.Scripting.Conditions.Database.newQueryHasResultsCondition(HiveUtil.FRIEND_COLLECTION, {did: "$caller_did"});
        let wasCreated = await this.selfVault.getScripting().setScript(scriptName, executionSequence/*, accessCondition*/);
        if (wasCreated) {
            console.log("HiveService - setScriptGetGroupMessageList - success");
        }
        else {
            console.log("HiveService - setScriptGetGroupMessageList - failure");
            this.sentry.notify("HiveService - setScriptGetGroupMessageList - failure - did: "+this.selfVaultOwnerDid+", groupId: "+groupId);
        }
    }

    async callScriptGetGroupMessageList(did: string, groupId: string, timestamp: number): Promise<GroupMessage[]> {
        console.log("HiveSerivce - callScriptGetGroupMessageList - groupId: "+groupId);
        let scriptName = "callScriptGetGroupMessageList_" + groupId;
        let messageList: GroupMessage[] = [];
        if (this.vaultMap.has(did)) {
            console.log("has group in vault");
            let vault = this.vaultMap.get(did);
            let scriptResult = await vault.getScripting().call(scriptName, {
                timestamp: timestamp
            });
            console.log("HiveService - scriptResult:");
            console.log(scriptResult);
            let getGroupMessageList = scriptResult.getGroupMessageList as HivePlugin.JSONObject;
            let items = getGroupMessageList.items as HivePlugin.JSONObject[];
            for (let item of items) {
                let groupMessage = GroupMessage.fromJsonObject((item.messageItem as HivePlugin.JSONObject).message);
                messageList.push(groupMessage);
            }
        }
        return messageList;
    }

    async setScriptGetUserData() {
        console.log("HiveService - setScriptGetUserData");
        let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
            hiveManager.Scripting.Executables.Database.newFindOneQuery(HiveUtil.SELF_DATA_COLLECTION, {key: "$params.key"}, {}, true, "getUserData")
        ]);
        let wasCreated = await this.selfVault.getScripting().setScript("callScriptGetUserData", executionSequence);
        if (wasCreated) {
            console.log("HiveService - setScriptGetUserData - success");
        }
        else {
            console.log("HiveService - setScriptGetUserData - failure");
            this.sentry.notify("HiveService - setScriptGetUserData - failure - did: "+this.selfVaultOwnerDid);
        }
    }

    async callScriptGetUserData(did: string, key: string): Promise<string> {
        console.log("HiveSerivce - callScriptGetUserData");
        let value: string = "";
        if (this.vaultMap.has(did)) {
            try {
                let vault = this.vaultMap.get(did);
                let scriptResult = await vault.getScripting().call("callScriptGetUserData", {
                    key: key
                });
                console.log("HiveService - scriptResult:");
                console.log(scriptResult);
                let getUserData = scriptResult.getUserData as HivePlugin.JSONObject;
                let items = getUserData.items as HivePlugin.JSONObject[];
                if (items[0] != null) {
                    value = items[0].value as string;
                }
            }
            catch (e) {
                console.log("HiveSerivce - callScriptGetUserData - error with did: "+did+" - key: "+key);
                console.log(e);
                this.sentry.notify("HiveSerivce - callScriptGetUserData - error with did: "+did+" - key: "+key);
                this.sentry.notify(e);
                value = null;
            }
        }
        return value;
    }

    async setScriptGetAllUserData() {
        console.log("HiveService - setScriptGetAllUserData");
        let executionSequence = hiveManager.Scripting.Executables.newAggregatedExecutable([
            hiveManager.Scripting.Executables.Database.newFindManyQuery(HiveUtil.SELF_DATA_COLLECTION, {}, {}, true, "getAllUserData")
        ]);
        let wasCreated = await this.selfVault.getScripting().setScript("callScriptGetAllUserData", executionSequence);
        if (wasCreated) {
            console.log("HiveService - setScriptGetAllUserData - success");
        }
        else {
            console.log("HiveService - setScriptGetAllUserData - failure");
            this.sentry.notify("HiveService - setScriptGetAllUserData - failure - did: "+this.selfVaultOwnerDid);
        }
    }

    async callScriptGetAllUserData(did: string): Promise<any[]> {
        console.log("HiveSerivce - callScriptGetAllUserData");
        let items: any[] = [];
        if (this.vaultMap.has(did)) {
            try {
                let vault = this.vaultMap.get(did);
                let scriptResult = await vault.getScripting().call("callScriptGetAllUserData");
                console.log("HiveService - scriptResult:");
                console.log(scriptResult);
                let getAllUserData = scriptResult.getAllUserData as HivePlugin.JSONObject;
                items = getAllUserData.items as HivePlugin.JSONObject[];
            }
            catch (e) {
                console.log("HiveSerivce - callScriptGetAllUserData - error with did: "+did);
                console.log(e);
                this.sentry.notify("HiveSerivce - callScriptGetAllUserData - error with did: "+did);
                this.sentry.notify(e);
                items = [];
            }
        }
        return items;
    }

    async createCollection(collectionName: string, options: HivePlugin.Database.CreateCollectionOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.selfVault.getDatabase().createCollection(collectionName, options);
                if (result && result.created) {
                    console.log("HiveService - createCollection - success: "+collectionName);
                    resolve(true);
                }
                else {
                    console.log("HiveService - createCollection - failure: "+collectionName);
                    //this.sentry.notify("HiveService - createCollection - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                    resolve(false);
                }
            }
            catch (e) {
                console.log("HiveService - createCollection - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - createCollection - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async deleteCollection(collectionName: string, options: HivePlugin.Database.DeleteCollectionOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.selfVault.getDatabase().deleteCollection(collectionName, options);
                if (result && result.deleted) {
                    console.log("HiveService - deleteCollection - success: "+collectionName);
                    resolve(true);
                }
                else {
                    console.log("HiveService - deleteCollection - failure: "+collectionName);
                    //this.sentry.notify("HiveService - deleteCollection - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                    resolve(false);
                }
            }
            catch (e) {
                console.log("HiveService - deleteCollection - error: "+collectionName);
                console.log(e);
                resolve(false);
            }
        });
    }

    async insertOne(collectionName: string, document: HivePlugin.JSONObject, options: HivePlugin.Database.InsertOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().insertOne(collectionName, document, options).then(result => {
                    if (result && result.insertedId) {
                        console.log("HiveService - insertOne - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - insertOne - failure: "+collectionName);
                        //this.sentry.notify("HiveService - insertOne - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - insertOne - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - insertOne - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async insertMany(collectionName: string, documents: HivePlugin.JSONObject[], options: HivePlugin.Database.InsertOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().insertMany(collectionName, documents, options).then(result => {
                    if (result && result.insertedIds.length == documents.length) {
                        console.log("HiveService - insertMany - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - insertMany - failure: "+collectionName);
                        //this.sentry.notify("HiveService - insertMany - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - insertMany - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - insertMany - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async updateOne(collectionName: string, filter: HivePlugin.JSONObject, updateQuery: HivePlugin.JSONObject, options: HivePlugin.Database.UpdateOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().updateOne(collectionName, filter, updateQuery, options).then(result => {
                    if (result && result.modifiedCount > 0) {
                        console.log("HiveService - updateOne - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - updateOne - failure: "+collectionName);
                        //this.sentry.notify("HiveService - updateOne - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - updateOne - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - updateOne - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async updateMany(collectionName: string, filter: HivePlugin.JSONObject, updateQuery: HivePlugin.JSONObject, options: HivePlugin.Database.UpdateOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().updateMany(collectionName, filter, updateQuery, options).then(result => {
                    if (result && result.modifiedCount > 0) {
                        console.log("HiveService - updateMany - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - updateMany - failure: "+collectionName);
                        //this.sentry.notify("HiveService - updateMany - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - updateMany - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - updateMany - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async deleteOne(collectionName: string, filter: HivePlugin.JSONObject = {}, options: HivePlugin.Database.DeleteOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().deleteOne(collectionName, filter, options).then(result => {
                    if (result && result.deletedCount > 0) {
                        console.log("HiveService - deleteOne - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - deleteOne - failure: "+collectionName);
                        //this.sentry.notify("HiveService - deleteOne - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - deleteOne - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - deleteOne - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async deleteMany(collectionName: string, filter: HivePlugin.JSONObject = {}, options: HivePlugin.Database.DeleteOptions = {}): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().deleteMany(collectionName, filter, options).then(result => {
                    if (result && result.deletedCount > 0) {
                        console.log("HiveService - deleteMany - success: "+collectionName);
                        resolve(true);
                    }
                    else {
                        console.log("HiveService - deleteMany - failure: "+collectionName);
                        //this.sentry.notify("HiveService - deleteMany - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(false);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - deleteMany - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - deleteMany - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(false);
            }
        });
    }

    async findOne(collectionName: string, query: HivePlugin.JSONObject = {}, options: HivePlugin.Database.FindOptions = {}): Promise<HivePlugin.JSONObject> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().findOne(collectionName, query, options).then(result => {
                    if (result) {
                        console.log("HiveService - findOne - success: "+collectionName);
                        resolve(result);
                    }
                    else {
                        console.log("HiveService - findOne - failure: "+collectionName);
                        //this.sentry.notify("HiveService - findOne - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve(null);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - findOne - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - findOne - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve(null);
            }
        });
    }

    async findMany(collectionName: string, query: HivePlugin.JSONObject = {}, options: HivePlugin.Database.FindOptions = {}): Promise<HivePlugin.JSONObject[]> {
        return new Promise(async (resolve, reject) => {
            try {
                this.selfVault.getDatabase().findMany(collectionName, query, options).then(result => {
                    if (result) {
                        console.log("HiveService - findMany - success: "+collectionName);
                        resolve(result);
                    }
                    else {
                        console.log("HiveService - findMany - failure: "+collectionName);
                        //this.sentry.notify("HiveService - findMany - failure - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                        resolve([]);
                    }
                });
            }
            catch (e) {
                console.log("HiveService - findMany - error: "+collectionName);
                console.log(e);
                this.sentry.notify("HiveService - findMany - error - did: "+this.selfVaultOwnerDid+", collectionName: "+collectionName);
                this.sentry.notify(e);
                resolve([]);
            }
        });
    }
}