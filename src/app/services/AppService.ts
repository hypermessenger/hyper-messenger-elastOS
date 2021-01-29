import { Injectable } from '@angular/core';
import { ToastController, NavController, LoadingController } from '@ionic/angular';
import { ToastType } from '../models/enums/toast-type.enum';
import { DIDHelper } from '@elastosfoundation/trinity-dapp-sdk/dist/did';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { FriendService } from './FriendService';
import { MessageService } from './MessageService';
import { GroupService } from './GroupService';
import { GroupMessageService } from './GroupMessageSerivce';
import { StorageService } from './StorageService';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let notificationManager: NotificationManagerPlugin.NotificationManager;
declare let didManager: DIDPlugin.DIDManager;
declare let didSessionManager: DIDSessionManagerPlugin.DIDSessionManager;

@Injectable({
    providedIn: "root"
})
export class AppService {
    private isAppHidden = true;
    private spinner;

    constructor(
        private toastController: ToastController,
        private navController: NavController,
        private loadingController: LoadingController,
        private friendService: FriendService,
        private messageService: MessageService,
        private groupService: GroupService,
        private groupMessageService: GroupMessageService,
        private storageService: StorageService
    ) {
        //console.log("AppService - constructor");
    }

    init() {
        console.log("AppService - init");
        appManager.setListener((ret) => {
            if (ret.message == "navback") {
                this.navController.back();
            }
            let messageObject = JSON.parse(ret.message);
            if (messageObject.action == "hidden") {
                this.isAppHidden = true;
            }
            if (messageObject.action == "visible") {
                this.isAppHidden = false;
            }
        });
        titleBarManager.addOnItemClickedListener((menuIcon) => {
            if (menuIcon.key === "back") {
                this.navController.back();
            }
            if (menuIcon.key === "backToHome") {
                this.navController.navigateBack('/home');
            }
            if (menuIcon.key === "editProfile") {
                //this.navController.navigateBack('/edit-profile');
                this.navController.navigateForward("/edit-profile");
            }
        });
    }

    showApp() {
        appManager.setVisible("show");
    }

    scanFriendIdentity() {
        return new Promise((resolve, reject) => {
            appManager.sendIntent("scanqrcode", {}, {}, (res) => {
                resolve(res.result.scannedContent);
            }, (err: any) => {
                console.error(err);
                reject(err);
            });
        });
    }

    toast(message: string, type: ToastType) {
        var color: string = "success";
        if (type == ToastType.SUCCESS) {
            color = "success";
        }
        else if (type == ToastType.WARNING) {
            color = "warning";
        }
        else if (type == ToastType.ERROR) {
            color = "danger";
        }
        this.toastController.create({
            message: message,
            duration: 2000,
            color: color
        }).then(toast => toast.present());
    }

    async showSpinner() {
        this.hideSpinner();
        this.spinner = await this.loadingController.create({
            spinner: null,
            message: '<div class="custom-spinner-container"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div><ion-label>Please wait...</ion-label></div>'
        });
        this.spinner.onWillDismiss().then(() => {
            this.spinner = null;
        });
        return await this.spinner.present();
    }

    async hideSpinner() {
        if (this.spinner) {
            await this.spinner.dismiss();
            this.spinner = null;
        }
    }

    notify(nickname: string) {
        this.toastController.create({
            message: "Received new message from "+nickname+".",
            duration: 2000,
            position: "top",
            cssClass: "inner-notification"
        }).then(toast => toast.present());
    }

    sendNotification(request: NotificationManagerPlugin.NotificationRequest) {
        if (this.isAppHidden) {
            notificationManager.sendNotification(request);
        }
    }

    setTitle(title: string) {
        titleBarManager.setTitle(title);
    }

    setBackground(color: string, darkFont: boolean) {
        titleBarManager.setBackgroundColor(color);
        darkFont ?
            titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK) :
            titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
    }

    setWhiteBackground() {
        titleBarManager.setBackgroundColor('#f8f8ff');
        titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.DARK);
    }

    setDefaultBackground() {
        titleBarManager.setBackgroundColor('#e31a50');
        titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
    }

    setHome() {
        titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.HOME);
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, null);
        //this.setWhiteBackground();
    }

    setBack() {
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
            key: "back",
            iconPath: TitleBarPlugin.BuiltInIcon.BACK
        });
    }

    setBackToHome() {
        titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
            key: "backToHome",
            iconPath: TitleBarPlugin.BuiltInIcon.BACK
        });
    }

    isDidPublished(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const userDID = await this.getUserDID();
            didManager.resolveDidDocument(userDID, false, (didDocument: DIDPlugin.DIDDocument) => {
                if (didDocument == null) {
                    resolve(false);
                }
                else {
                    console.log(didDocument);
                    resolve(true);
                }
            });
        });
    }

    isHiveRegistered(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const userDID = await this.getUserDID();
            didManager.resolveDidDocument(userDID, false, (didDocument: DIDPlugin.DIDDocument) => {
                if (didDocument == null) {
                    resolve(false);
                }
                else {
                    console.log(didDocument);
                    let hasHive = false;
                    let services = didDocument.getServices();
                    for (let service of services) {
                        if (service.getType() == "HiveVault") {
                            hasHive = true;
                        }
                    }
                    resolve(hasHive);
                }
            });
        });
    }

    async setupHive() {
        await TrinitySDK.Hive.HiveHelper.suggestUserToSetupVault();
    }

    resolveDid(did: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            didManager.resolveDidDocument(did, true, (didDocument: DIDPlugin.DIDDocument) => {
                if (didDocument == null) {
                    console.log("resolve did null");
                }
                else {
                    console.log("resolve did not null");
                    console.log(didDocument);
                }
            });
        });
    }

    async getUserDID(): Promise<string> {
        const didHelper = new DIDHelper();
        const userDID = (await didHelper.getOrCreateAppIdentityCredential()).getIssuer();
        console.log("AppService - getUserDID: "+userDID);
        return userDID;
    }

    async cleanLocalDatabase() {
        let friendList = await this.friendService.getFriendList();
        for (let friend of friendList) {
            await this.messageService.deleteTenant(friend.did);
        }
        await this.friendService.deleteDatabase();

        let groupList = await this.groupService.getGroupList();
        for (let group of groupList) {
            await this.groupMessageService.deleteTenant(group.groupId);
        }
        await this.groupService.deleteDatabase();
        await this.storageService.deleteDatabase();
    }
}