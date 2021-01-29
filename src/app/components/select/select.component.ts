import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Friend } from 'src/app/models/friend.model';
import { FriendService } from 'src/app/services/FriendService';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements OnInit {

  public friendList: Friend[] = [];

  constructor(
    private modalCtrl: ModalController,
    private friendService: FriendService
  ) { }

  ngOnInit() {
    this.init();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  init() {
  }
}
