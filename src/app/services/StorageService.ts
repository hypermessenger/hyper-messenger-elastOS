import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
PouchDB.plugin(PouchFind);

@Injectable({
    providedIn: "root"
})
export class StorageService {
    database: any;

    constructor() {}

    init() {
        //console.log("FriendService - init");
        this.database = new PouchDB("storage-db");

        this.database.info().then(success => {
            //console.log("FriendService - info: "+JSON.stringify(success));
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

    insertProperty(key: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.put({
                _id: key,
                value: value
            }).then(response => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
        });
    }

    updateProperty(key: string, value: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.get(key).then(doc => {
                return this.database.put({
                    _id: key,
                    _rev: doc._rev,
                    value: value
                });
            }).then(response => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
        });
    }

    deleteProperty(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.get(key).then(doc => {
                return this.database.remove(doc);
            }).then(response => {
                resolve(true);
            }).catch(error => {
                reject(error);
            });
        });
    }

    getProperty(key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.database.get(key).then(doc => {
                let value: string = doc.value;
                resolve(value);
            }).catch(error => {
                resolve(null);
            });
        });
    }

    getPropertyList(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let propertyList: any[] = [];
            this.database.find({
                selector: {}
            }).then(response => {
                let docs = response.docs;
                docs.forEach(doc => {
                    let property: any = {
                        key: doc._id,
                        value: doc.value
                    };
                    propertyList.push(property);
                });
                resolve(propertyList);
            }).catch(error => {
                resolve(propertyList);
            });
        });
    }

    getVisit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.get('visit').then(doc => {
                const value: boolean = doc.value;
                resolve(value);
            }).catch(error => {
                resolve(false);
            });
        });
    }

    setVisit(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.put({
                _id: 'visit',
                value: true
            }).then(res => {
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        });
    }
}