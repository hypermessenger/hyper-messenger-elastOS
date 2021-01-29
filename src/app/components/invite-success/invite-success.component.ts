import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-invite-success',
  templateUrl: './invite-success.component.html',
  styleUrls: ['./invite-success.component.scss'],
})
export class InviteSuccessComponent implements OnInit {

  constructor(
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {}

  finish() {
    this.modalCtrl.dismiss();
  }
}
