import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { IonTabs, ModalController } from '@ionic/angular';
import { Tab } from './tabs';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/services/AppService';
import { MessagesPage } from '../messages/messages.page';
import { ContactsPage } from '../contacts/contacts.page';
import { EventService } from 'src/app/services/EventService';
import { CarrierService } from 'src/app/services/CarrierService';
import { GroupsPage } from '../groups/groups.page';
import { UIService } from 'src/app/services/ui.service';
import { AccountPage } from '../account/account.page';
import { BadgeType } from 'src/app/models/enums/badge-type.enum';

export enum ActiveTab {
    MESSAGES = 1,
    GROUPS = 2,
    CONTACTS = 3,
    ACCOUNT = 4
}

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.page.html',
    styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit, OnDestroy {

    @ViewChild("tabs", {static: true}) tabs: IonTabs;

    private tabSub: Subscription;
    private currentTab: Tab;
    private tabsDidEnter = false;
    public activeTab: ActiveTab = 1;

    newMessageCount: number = 0;
    newGroupCount: number = 0;
    newContactCount: number = 0;
    newAccountCount: number = 0;

    constructor(
        private appService: AppService,
        private eventService: EventService,
        private carrierService: CarrierService,
        private modalController: ModalController,
        public UI: UIService,
        private ngZone: NgZone
    ) {}

    ngOnInit() {
        this.tabSub = this.tabs.ionTabsDidChange.subscribe(() => {
            if (this.currentTab != null) {
                this.currentTab.tabWillLeave();
            }
            this.currentTab = this.tabs.outlet.component as Tab;
            this.currentTab.tabWillEnter();
        });
        this.eventService.getObservable("carrier:newBadge").subscribe((data: any) => {
            if (data.type === BadgeType.MESSAGES && !(this.currentTab instanceof MessagesPage)) {
                this.ngZone.run(() => {
                    this.newMessageCount++;
                });
            }
            else if (data.type === BadgeType.GROUPS && !(this.currentTab instanceof GroupsPage)) {
                this.ngZone.run(() => {
                    this.newGroupCount++;
                });
            }
            else if (data.type === BadgeType.CONTACTS && !(this.currentTab instanceof ContactsPage)) {
                this.ngZone.run(() => {
                    this.newContactCount++;
                });
            }
            else if (data.type === BadgeType.ACCOUNT && !(this.currentTab instanceof AccountPage)) {
                this.ngZone.run(() => {
                    this.newAccountCount++;
                });
            }
        });
    }

    ionViewWillEnter() {
        this.appService.setHome();
        this.appService.setTitle(' ');
        this.appService.showApp();
    }

    ionViewDidEnter() {
        if (this.tabsDidEnter) {
            this.currentTab.tabWillEnter();
        }
        this.tabsDidEnter = true;
    }

    ionViewDidLeave() {
        this.currentTab.tabWillLeave();
    }

    ngOnDestroy() {
        this.tabSub.unsubscribe();
    }

    onMessagesTab() {
        this.newMessageCount = 0;
        this.activeTab = ActiveTab.MESSAGES;
    }

    onGroupsTab() {
        this.newGroupCount = 0;
        this.activeTab = ActiveTab.GROUPS;
    }

    onContactsTab() {
        this.newContactCount = 0;
        this.activeTab = ActiveTab.CONTACTS;
    }

    onAccountTab() {
        this.newAccountCount = 0;
        this.activeTab = ActiveTab.ACCOUNT;
    }

    getColor(tab: ActiveTab) {
        if (this.activeTab === tab) {
            switch (tab) {
                case 1:
                    return 'tertiary';
                case 2:
                    return 'warning';
                case 3:
                    return 'danger';
                case 4:
                    return 'primary';
            }
        }
        else {
            return 'medium';
        }
    }
}
