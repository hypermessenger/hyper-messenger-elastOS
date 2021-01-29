import { Component, OnInit } from '@angular/core';
import { CarrierService } from 'src/app/services/CarrierService';
import { AppService } from 'src/app/services/AppService';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { ToastType } from 'src/app/models/enums/toast-type.enum';

@Component({
  selector: 'app-popup-myaddress',
  templateUrl: './popup-myaddress.component.html',
  styleUrls: ['./popup-myaddress.component.scss'],
})
export class PopupMyaddressComponent implements OnInit{

  carrierAddress = "undefined";

  constructor(
    private carrierService: CarrierService,
    private appService: AppService,
    private clipboard: Clipboard
  ) {}

  ngOnInit() {
    this.carrierAddress = this.carrierService.getAddress();
  }

  onCopyAddress() {
    this.clipboard.copy(this.carrierAddress);
    this.appService.toast("Address has been copied to clipboard.", ToastType.SUCCESS);
  }

}
