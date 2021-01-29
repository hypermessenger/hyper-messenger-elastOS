import { Component, NgZone, OnInit } from '@angular/core';
import { NativeService } from 'src/app/services/native.service';
import { CarrierService } from 'src/app/services/CarrierService';
import { ModalController } from '@ionic/angular';
import { SplashPage } from '../splash/splash.page';
import { AppService } from 'src/app/services/AppService';
import { StorageService } from 'src/app/services/StorageService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { EventService } from 'src/app/services/EventService';
import { HiveService } from 'src/app/services/HiveService';

@Component({
    selector: 'app-onboard',
    templateUrl: './onboard.page.html',
    styleUrls: ['./onboard.page.scss'],
})
export class OnboardPage implements OnInit {

    constructor(
        private appService: AppService,
        private native: NativeService,
        private carrierService: CarrierService,
        private storageService: StorageService,
        private eventService: EventService,
        private hiveService: HiveService,
        private modalController: ModalController,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
    }

    ionViewWillEnter() {
        this.appService.showApp();
    }

    slideNext(slide) {
        slide.slideNext();
    }

    async getStarted() {
        await this.storageService.setVisit();
        const isDidPublished = await this.appService.isDidPublished();
        const isHiveRegistered = await this.appService.isHiveRegistered();
        const did = await this.storageService.getProperty("did");
        if (!isDidPublished || !isHiveRegistered) {
            this.native.go('/publish-did');
        } else {
            if (did === null) {
                this.native.go("/sign-did");
            } else {
                this.native.go('/home');
            }
        }
    }

}
