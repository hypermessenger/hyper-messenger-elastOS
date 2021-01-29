import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { Platform, MenuController, IonRouterOutlet, ModalController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router, RouterOutlet } from '@angular/router';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { AppService } from './services/AppService';
import { CarrierService } from './services/CarrierService';
import { EventService } from './services/EventService';
import { ToastType } from './models/enums/toast-type.enum';
import { FriendService } from './services/FriendService';
import { MessageService } from './services/MessageService';
import { HiveService } from './services/HiveService';
import { GroupService } from './services/GroupService';
import { GroupMessageService } from './services/GroupMessageSerivce';
import { StorageService } from './services/StorageService';
import { SplashPage } from './pages/splash/splash.page';
import { HiveUtil } from './utils/HiveUtil';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    identity: string = "undefined";
    @ViewChild(IonRouterOutlet, {static: true}) routerOutlet: IonRouterOutlet;

    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private menuController: MenuController,
        private router: Router,
        private clipboard: Clipboard,
        private appService: AppService,
        private eventService: EventService,
        private carrierService: CarrierService,
        private hiveService: HiveService,
        private friendService: FriendService,
        private messageService: MessageService,
        private groupService: GroupService,
        private groupMessageService: GroupMessageService,
        private storageService: StorageService,
        private modalController: ModalController,
        private ngZone: NgZone
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.presentSplashScreen();
        this.platform.ready().then(async () => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();
            this.appService.init();
            this.eventService.init();
            this.storageService.init();
            await this.hiveService.init();
            await this.friendService.init();
            await this.messageService.init();
            this.groupService.init();
            await this.groupMessageService.init();
            await this.carrierService.init();

            this.identity = await this.storageService.getProperty("did");
            console.log("AppComponent - did: "+this.identity);
            const returnedUser = await this.storageService.getVisit();
            if (returnedUser) {
                const did = this.identity;
                const isDidPublished = await this.appService.isDidPublished();
                const isHiveRegistered = await this.appService.isHiveRegistered();
                console.log("AppComponent - did: "+did);
                console.log("AppComponent - isDidPublished: "+isDidPublished);
                console.log("AppComponent - isHiveRegistered: "+isHiveRegistered);
                if (!isDidPublished || !isHiveRegistered) {
                    this.router.navigate(['/publish-did']);
                }
                else {
                    if (did === null) {
                        this.router.navigate(["/sign-did"]);
                    }
                    else {
                        this.router.navigate(['/home']);
                    }
                }
            }
            else {
                this.router.navigate(["/onboard"]);
            }

            this.setupBackKeyNavigation();
        });
    }

    async presentSplashScreen() {
        if (!this.carrierService.isDebug()) {
            const modal = await this.modalController.create({component: SplashPage});
            await modal.present();
        }
    }

    ngOnInit() {
        this.eventService.getObservable("carrier:onConnection").subscribe(async (data) => {
            const localCarrierAddress = this.carrierService.getAddress();
            const hiveCarrierAddressObject = await this.hiveService.findOne(HiveUtil.SELF_DATA_COLLECTION, {key: "address"});
            if (hiveCarrierAddressObject != null) {
                const hiveCarrierAddress = hiveCarrierAddressObject.value as string;
                console.log("localCarrierAddress: "+localCarrierAddress);
                console.log("hiveCarrierAddress: "+hiveCarrierAddress);
                if (localCarrierAddress != hiveCarrierAddress) {
                    await this.appService.showSpinner();
                    await this.cleanLocalDatabase();
                    await this.cleanCarrier();
                    this.storageService.init();
                    await this.friendService.init();
                    await this.messageService.init();
                    this.groupService.init();
                    await this.groupMessageService.init();
                    await this.appService.hideSpinner();
                    this.ngZone.run(() => {
                        this.router.navigate(["/onboard"]);
                    });
                }
            }
            this.identity = await this.storageService.getProperty("did");
        });

        this.eventService.getObservable("initDID").subscribe(async (data) => {
            this.identity = await this.storageService.getProperty("did");
        });
    }

    ngOnDestroy() {
        //console.log("AppComponent - ngOnDestroy");
    }

    async cleanLocalDatabase() {
        await this.appService.cleanLocalDatabase();
    }

    async cleanCarrier() {
        for (let userId in CarrierService.friendList) {
            await this.carrierService.removeFriendByUserId(userId);
        }
        await this.carrierService.leaveAllGroup();
    }

    onCopyIdentity() {
        this.clipboard.copy(this.identity);
        this.appService.toast("Identity has been copied to clipboard.", ToastType.SUCCESS);
    }

    onMyProfile() {
        this.menuController.close("sideMenu");
        this.router.navigate(["/my-profile"]);
    }

    onSettings() {
        this.menuController.close("sideMenu");
        this.router.navigate(["/settings"]);
    }

    onAddContact() {
        this.menuController.close("sideMenu");
        this.router.navigate(["/add-friend"]);
    }

    onCreateGroup() {
        this.menuController.close("sideMenu");
        this.router.navigate(["/add-group"]);
    }

    setupBackKeyNavigation() {
        this.platform.backButton.subscribeWithPriority(0, () => {
            if (this.routerOutlet && this.routerOutlet.canGoBack()) {
                this.routerOutlet.pop();
            }
            else {
                navigator['app'].exitApp();
            }
        });
    }
}
