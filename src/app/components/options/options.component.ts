import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams, ModalController } from '@ionic/angular';
import { MessageService } from 'src/app/services/MessageService';
import { GroupService } from 'src/app/services/GroupService';
import { SelectComponent } from '../select/select.component';
import { NativeService } from 'src/app/services/native.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
})
export class OptionsComponent implements OnInit {

  public type: string;
  public title: string;

  constructor(
    public popover: PopoverController,
    private messageService: MessageService,
    private groupService: GroupService,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private native: NativeService
  ) { }

  ngOnInit() {
    this.type = this.navParams.get('type');
    console.log('Options for: ', this.type);

    if (this.type === 'message') {
      this.title = 'Message';
    } else if (this.type === 'group') {
      this.title = 'Group';
    }
  }

  onPin() {
    this.popover.dismiss();
    if (this.type === 'message') {
      this.messageService.pinningMessage = true;
    } else if (this.type === 'group') {
      this.groupService.pinningGroup = true;
    }
  }

  async onSelect() {
    this.popover.dismiss();
    await this.native.hideModal();
    this.native.modal = await this.modalCtrl.create({
      component: SelectComponent,
      componentProps: {
      },
    });
    this.native.modal.onWillDismiss().then(() => {
      this.native.modal = null;
    });
    return await this.native.modal.present();
  }

}
