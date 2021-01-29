import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CarrierService } from 'src/app/services/CarrierService';
import { AppService } from 'src/app/services/AppService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { NativeService } from 'src/app/services/native.service';
import { ProfileInfo } from '../profile-info/profile-info.page';
import { StorageService } from 'src/app/services/StorageService';
import { HiveService } from 'src/app/services/HiveService';
import { HiveUtil } from 'src/app/utils/HiveUtil';
import { NavParams } from '@ionic/angular';

@Component({
    selector: 'app-edit-info',
    templateUrl: './edit-info.page.html',
    styleUrls: ['./edit-info.page.scss'],
})
export class EditInfoPage implements OnInit {

    public profileInfo: ProfileInfo;

    constructor(
        private router: Router,
        private zone: NgZone,
        private storageService: StorageService,
        private hiveService: HiveService,
        private appService: AppService,
        private native: NativeService
    ) {}

    ngOnInit() {
        const navigation = this.router.getCurrentNavigation();
        this.zone.run(() => {
            if (navigation.extras.state) {
                this.profileInfo = navigation.extras.state.profileInfo;
                this.appService.setTitle('Edit ' + this.profileInfo.title);
            }
        });
    }

    ionViewWillEnter() {
        this.appService.setBack();
        this.appService.setBackground('#3980eb', false);
    }

    async onUpdate() {
        if (this.profileInfo.type == "name") {
            if (this.profileInfo.value == "") {
                this.appService.toast("Name cannot be empty.", ToastType.WARNING);
                return;
            } else {
                await this.storageService.updateProperty(this.profileInfo.type, this.profileInfo.value);
                this.hiveService.updateOne(
                    HiveUtil.SELF_DATA_COLLECTION,
                    {key: this.profileInfo.type},
                    {$set: {value: this.profileInfo.value}}
                );
            }
        } else {
            const property = await this.storageService.getProperty(this.profileInfo.type);
            if (property == null) {
                await this.storageService.insertProperty(this.profileInfo.type, this.profileInfo.value);
                this.hiveService.insertOne(HiveUtil.SELF_DATA_COLLECTION, {
                    key: this.profileInfo.type,
                    value: this.profileInfo.value
                });
            } else {
                await this.storageService.updateProperty(this.profileInfo.type, this.profileInfo.value);
                this.hiveService.updateOne(
                    HiveUtil.SELF_DATA_COLLECTION,
                    {key: this.profileInfo.type},
                    {$set: {value: this.profileInfo.value}}
                );
            }
        }
        this.native.goBack();
    }

}
