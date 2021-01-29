import { Component, NgZone, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { EventService } from 'src/app/services/EventService';
import { HiveService } from 'src/app/services/HiveService';
import { NativeService } from 'src/app/services/native.service';
import { StorageService } from 'src/app/services/StorageService';
import { HiveUtil } from 'src/app/utils/HiveUtil';

declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;

@Component({
    selector: 'app-sign-did',
    templateUrl: './sign-did.page.html',
    styleUrls: ['./sign-did.page.scss'],
})
export class SignDidPage implements OnInit {
    doRestore: boolean = true;

    constructor(
        private storageService: StorageService,
        private hiveService: HiveService,
        private appService: AppService,
        private eventService: EventService,
        private native: NativeService,
        private carrierService: CarrierService,
        private ngZone: NgZone,
        private alertController: AlertController
    ) {
        console.log("SignDidPage - constructor");
    }

    async ngOnInit() {
        const did = await this.storageService.getProperty("did");
    }

    async ionViewWillEnter() {
        this.appService.setBackground('#ffffff', true);
        this.appService.showApp();
    }

    async signInDID() {
        if (this.doRestore) {
            await this.doSignIn();
        } else {
            await this.native.hideAlert();
            this.native.alert = await this.alertController.create({
                header: "Restore Data",
                message: "You have unchecked the 'Restore my data' option. Your data won't be restored from previous usage. This will reset your Hive storage as well. Are you sure you want to continue?",
                buttons: [
                    {
                        text: "Cancel",
                        role: "cancel"
                    },
                    {
                        text: "Confirm",
                        handler: async () => {
                            await this.doSignIn();
                        }
                    }
                ]
            });
            this.native.alert.onWillDismiss().then(() => {
                this.native.alert = null;
            });
            await this.native.alert.present();
        }
    }

    async doSignIn() {
        await this.appService.showSpinner();
        appManager.sendIntent("https://did.elastos.net/credaccess", {
            claims: { name: true, gender: false, email: false, telephone: false, nation: false, description: false, },
            customization: { primarycolorlightmode: "#e31a50", primarycolordarkmode: "#e31a50" }
        }, {}, async (response: {result: {did: string, presentation: string}}) => {
            console.log(response);
            if (response.result && response.result.did) {
                didManager.VerifiablePresentationBuilder.fromJson(
                    JSON.stringify(response.result.presentation),
                    async (presentation: DIDPlugin.VerifiablePresentation
                ) => {
                    const credentials: DIDPlugin.VerifiableCredential[] = presentation.getCredentials();
                    console.log('credaccess - VerifiableCredential[]', credentials);
                    if (credentials.length > 0) {
                        const subject = credentials[0].getSubject();
                        const did = subject.id;
                        const profileInfo = [];

                        await this.storageService.insertProperty("did", did);
                        this.eventService.publishEvent("initDID", {response: "success"});
                        await this.hiveService.init();

                        if (!this.doRestore) {
                            console.log("clear hive data");
                            let hiveFriendList = HiveUtil.getFriendList(await this.hiveService.findMany(HiveUtil.FRIEND_COLLECTION));
                            for (let hiveFriend of hiveFriendList) {
                                await this.hiveService.deleteMany(hiveFriend.did);
                            }
                            await Promise.all([
                                this.hiveService.deleteMany(HiveUtil.FRIEND_COLLECTION),
                                this.hiveService.deleteMany(HiveUtil.GROUP_COLLECTION),
                                this.hiveService.deleteMany(HiveUtil.SELF_DATA_COLLECTION)
                            ]);
                        }

                        const address = this.carrierService.getAddress();
                        const userId = this.carrierService.getUserId();

                        let oldAddress = await this.hiveService.findOne(HiveUtil.SELF_DATA_COLLECTION, {key: "address"});
                        let oldUserId = await this.hiveService.findOne(HiveUtil.SELF_DATA_COLLECTION, {key: "userId"});
                        if (oldAddress == null) {
                            //initial process
                            console.log("SignDidPage - initial process");
                            credentials.map((credential) => {
                                if (credential.getSubject().hasOwnProperty('name')) {
                                    profileInfo.push({
                                        key: 'name',
                                        value: credential.getSubject().name
                                    });
                                }
                                if (credential.getSubject().hasOwnProperty('telephone')) {
                                    profileInfo.push({
                                        key: 'phone',
                                        value: credential.getSubject().telephone
                                    });
                                }
                                if (credential.getSubject().hasOwnProperty('email')) {
                                    profileInfo.push({
                                        key: 'email',
                                        value: credential.getSubject().email
                                    });
                                }
                                if (credential.getSubject().hasOwnProperty('nation')) {
                                    profileInfo.push({
                                        key: 'location',
                                        value: credential.getSubject().nation
                                    });
                                }
                                if (credential.getSubject().hasOwnProperty('gender')) {
                                    profileInfo.push({
                                        key: 'gender',
                                        value: credential.getSubject().gender
                                    });
                                }
                                if (credential.getSubject().hasOwnProperty('description')) {
                                    profileInfo.push({
                                        key: 'description',
                                        value: credential.getSubject().description
                                    });
                                }
                            });
                            console.log('Found profile info from credaccess', profileInfo);
                            profileInfo.forEach(async (info) => {
                                await this.storageService.insertProperty(info.key, info.value);
                            });
                            await this.hiveService.deleteMany(HiveUtil.SELF_DATA_COLLECTION);
                            let selfData: HivePlugin.JSONObject[] = [
                                {key: "address", value: address},
                                {key: "userId", value: userId}
                            ];
                            selfData = selfData.concat(profileInfo);
                            await this.hiveService.insertMany(HiveUtil.SELF_DATA_COLLECTION, selfData);
                        }
                        else {
                            //restore process
                            console.log("SignDidPage - restore process");
                            if (address != (oldAddress.value as string)) {
                                let hiveFriendList = HiveUtil.getFriendList(await this.hiveService.findMany(HiveUtil.FRIEND_COLLECTION));
                                console.log("SignDidPage - restore friendList");
                                console.log(hiveFriendList);
                                for (let hiveFriend of hiveFriendList) {
                                    await this.carrierService.restoreFriend(oldAddress.value as string, oldUserId.value as string, hiveFriend);
                                }
                                await this.hiveService.updateOne(HiveUtil.SELF_DATA_COLLECTION, {key: "address"}, {$set: {value: address}});
                                await this.hiveService.updateOne(HiveUtil.SELF_DATA_COLLECTION, {key: "userId"}, {$set: {value: userId}});
                                let selfDataList = await this.hiveService.findMany(HiveUtil.SELF_DATA_COLLECTION);
                                console.log("restore selfDataList");
                                console.log(selfDataList);
                                for (let data of selfDataList) {
                                    this.storageService.insertProperty(data.key as string, data.value as string);
                                }
                            }
                        }
                        await Promise.all([
                            this.hiveService.setScriptGetUserData(),
                            this.hiveService.setScriptGetAllUserData()
                        ]);

                        await this.appService.hideSpinner();
                        this.ngZone.run(async () => {
                            this.native.go("/get-started");  
                        });
                    }
                    console.log(credentials);
                }, async error => {
                    console.log(error);
                    await this.appService.hideSpinner();
                });
            }
            else {
                console.log("No DID field returned by credaccess, there is something wrong.");
                await this.appService.hideSpinner();
                this.appService.toast("You must share your DID and name in order to sign in.", ToastType.WARNING);
            }
        }, (err) => {
            console.log(err);
        });
    }
}