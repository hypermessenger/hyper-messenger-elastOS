import { Component, NgZone, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/AppService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Router, ActivatedRoute } from '@angular/router';
import { Friend } from 'src/app/models/friend.model';
import { FriendService } from 'src/app/services/FriendService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { HiveService } from 'src/app/services/HiveService';
import { HiveUtil } from 'src/app/utils/HiveUtil';
import { NativeService } from 'src/app/services/native.service';
import { ProfileInfo } from '../profile-info/profile-info.page';
import { UIService } from 'src/app/services/ui.service';

@Component({
    selector: 'app-friend-profile',
    templateUrl: './friend-profile.page.html',
    styleUrls: ['./friend-profile.page.scss'],
})
export class FriendProfilePage implements OnInit {

    public friend: Friend;
    private userId: string;
    public nickname = '';
    public profileInfo: ProfileInfo[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private carrierService: CarrierService,
        private friendService: FriendService,
        private hiveService: HiveService,
        private native: NativeService,
        private ngZone: NgZone,
        public UI: UIService
    ) {
        const navigation = this.router.getCurrentNavigation();
        this.ngZone.run(() => {
            if (navigation.extras.state) {
                this.friend = navigation.extras.state.friend;
            }
        });
    }

    ionViewWillEnter() {
        this.appService.setTitle("Friend Profile");
        this.appService.setBackground('#ffffff', true);
        // this.appService.setBackground('#e31a50', false);
        this.appService.setBack();
    }

    ionViewWillLeave() {
        this.appService.setWhiteBackground();
    }

    async ngOnInit() {
        await this.appService.showSpinner();
        await this.getFriend();
        this.appService.hideSpinner();
    }

    async getFriend() {
        const items = await this.hiveService.callScriptGetAllUserData(this.friend.did);
        this.profileInfo.push(
            {
                title: 'Name',
                type: 'name',
                value: this.getValue(items, "name")
            },
            {
                title: 'Phone',
                type: 'phone',
                value: this.getValue(items, "phone")
            },
            {
                title: 'Email',
                type: 'email',
                value: this.getValue(items, "email")
            },
            {
                title: 'Location',
                type: 'location',
                value: this.getValue(items, "location")
            },
            {
                title: 'Gender',
                type: 'gender',
                value: this.getValue(items, "gender")
            },
            {
                title: 'Description',
                type: 'description',
                value: this.getValue(items, "description")
            }
        );
    }

    getValue(items: any[], key: string): string {
        let value = "";
        for (let item of items) {
            if (key === item.key) {
                value = item.value;
                break;
            }
        }
        return value;
    }

    onUpdate() {
        if (this.nickname == "") {
            this.appService.toast("Nickname is empty.", ToastType.WARNING);
        }
        else {
            this.friend.nickname = this.nickname;
            this.friendService.updateFriend(this.friend).then(success => {
                this.appService.toast("You have updated the nickname.", ToastType.SUCCESS);
                this.native.go('/home');
            }).catch(error => {
                this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
            });
        }
    }

}
