import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { NativeService } from 'src/app/services/native.service';

@Component({
    selector: 'app-get-started',
    templateUrl: './get-started.page.html',
    styleUrls: ['./get-started.page.scss'],
})
export class GetStartedPage implements OnInit {

    constructor(
        private appService: AppService,
        public native: NativeService
    ) {}

    ngOnInit() {
        this.appService.hideSpinner();
    }

    ionViewWillEnter() {
        this.appService.setWhiteBackground();
        this.appService.showApp();
    }

}
