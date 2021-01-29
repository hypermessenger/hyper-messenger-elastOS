import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams, PopoverController } from '@ionic/angular';
import { MessageService } from 'src/app/services/MessageService';
import { AppService } from 'src/app/services/AppService';
import { ToastType } from 'src/app/models/enums/toast-type.enum';
import { Message } from 'src/app/models/message.model';
import { Clipboard } from '@ionic-native/clipboard/ngx';

@Component({
    selector: 'app-message-action',
    templateUrl: './message-action.component.html',
    styleUrls: ['./message-action.component.scss']
})
export class MessageActionComponent implements OnInit {

    public message: Message;

    constructor(
        private navParams: NavParams,
        private messageService: MessageService,
        private appService: AppService,
        private modalController: ModalController,
        private clipboard: Clipboard
    ) {
        this.message = navParams.get("message");
    }

    ngOnInit() {}

    onClose() {
        this.modalController.dismiss();
    }

    onCopy() {
        this.modalController.dismiss();
        this.clipboard.copy(this.message.text);
        this.appService.toast("Message has been copied to clipboard.", ToastType.SUCCESS);
    }

    async onDelete() {
        this.modalController.dismiss();
        const deleteResponse = await this.messageService.deleteMessage(this.message);
        if (deleteResponse) {
            this.appService.toast("Message has been deleted.", ToastType.SUCCESS);
        } else {
            this.appService.toast("Sorry, something went wrong.", ToastType.ERROR);
        }
    }

}
