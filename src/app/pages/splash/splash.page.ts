import { Component, OnInit, NgZone } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Router } from '@angular/router';
import { EventService } from 'src/app/services/EventService';
import { ModalController } from '@ionic/angular';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

    constructor(
        private appService: AppService,
        private eventService: EventService,
        private carrierService: CarrierService,
        private router: Router,
        private ngZone: NgZone,
        private modalController: ModalController,
        private native: NativeService
    ) {

    }

    ngOnInit() {
        if (this.carrierService.isConnected()) {
            this.modalController.dismiss();
        }
        this.eventService.getObservable("carrier:onConnection").subscribe((data) => {
            this.ngZone.run(() => {
                if (this.carrierService.isConnected()) {
                    this.modalController.dismiss();
                }
            });
        });
    }

    ionViewWillEnter() {
        this.appService.setBackground('#ffffff', true);
        this.appService.setTitle(' ');
        this.appService.showApp();
    }

    ionViewWillLeave() {
        this.appService.setTitle(' ');
        this.appService.setWhiteBackground();
    }

}
