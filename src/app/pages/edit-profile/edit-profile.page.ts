import { Component, OnInit } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { AppService } from 'src/app/services/AppService';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { NativeService } from 'src/app/services/native.service';
import { ProfileInfo } from '../profile-info/profile-info.page';
import { ModalController } from '@ionic/angular';
import { PictureComponent } from 'src/app/components/picture/picture.component';
import { Avatar } from 'src/app/models/avatar.model';
import { StorageService } from 'src/app/services/StorageService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { HiveUtil } from 'src/app/utils/HiveUtil';
import { HiveService } from 'src/app/services/HiveService';

@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.page.html',
    styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage implements OnInit {
    userAvatar: Avatar = null;
    profileInfo: ProfileInfo[] = [];

    constructor(
        private appService: AppService,
        private storageService: StorageService,
        private hiveService: HiveService,
        public native: NativeService,
        private modalController: ModalController
    ) {}

    ngOnInit() {}

    ionViewWillEnter() {
        this.appService.setBack();
        this.appService.setTitle('Edit Profile');
        this.appService.setWhiteBackground();
        this.getSelfInfo();
    }

    ionViewWillLeave() {
        this.appService.setBackground('#3980eb', false);
    }

    async getSelfInfo() {
        const name = await this.storageService.getProperty("name");
        const phone = await this.storageService.getProperty("phone");
        const email = await this.storageService.getProperty("email");
        const location = await this.storageService.getProperty("location");
        const gender = await this.storageService.getProperty("gender");
        const description = await this.storageService.getProperty("description");
        this.profileInfo = [];
        this.profileInfo.push(
            {
                title: 'Name',
                type: 'name',
                value: name == null ? "" : name
            },
            {
                title: 'Phone',
                type: 'phone',
                value: phone == null ? "" : phone
            },
            {
                title: 'Email',
                type: 'email',
                value: email == null ? "" : email
            },
            {
                title: 'Location',
                type: 'location',
                value: location == null ? "" : location
            },
            {
                title: 'Gender',
                type: 'gender',
                value: gender == null ? "" : gender
            },
            {
                title: 'Description',
                type: 'description',
                value: description == null ? "" : description
            }
        );
    }

    async onUpdate() {
        this.profileInfo.forEach(async (info) => {
            if (info.type === "name") {
                if (info.value === "") {
                    this.appService.toast("Name cannot be empty.", ToastType.WARNING);
                    return;
                }
                else {
                    await this.storageService.updateProperty(info.type, info.value);
                    this.hiveService.updateOne(HiveUtil.SELF_DATA_COLLECTION, {key: info.type}, {$set: {value: info.value}});
                }
            }
            else {
                const property = await this.storageService.getProperty(info.type);
                if (property === null) {
                    await this.storageService.insertProperty(info.type, info.value);
                    this.hiveService.insertOne(HiveUtil.SELF_DATA_COLLECTION, {
                        key: info.type,
                        value: info.value
                    });
                }
                else {
                    await this.storageService.updateProperty(info.type, info.value);
                    this.hiveService.updateOne(HiveUtil.SELF_DATA_COLLECTION, {key: info.type}, {$set: {value: info.value}});
                }
            }
        });
        this.native.goBack();
    }

    async showUploadOptions() {
        await this.native.hideModal();
        this.native.modal = await this.modalController.create({
            component: PictureComponent,
            cssClass: 'pictureComponent'
        });
        this.native.modal.onWillDismiss().then((params) => {
            this.native.modal = null;
            if (params.data && params.data.avatar) {
                this.userAvatar = params.data.avatar;
            }
        });
        return await this.native.modal.present();
    }
}
