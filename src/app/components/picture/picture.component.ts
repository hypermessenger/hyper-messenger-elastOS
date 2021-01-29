import { Component, OnInit, NgZone } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';
import { ModalController } from '@ionic/angular';
import { Avatar } from 'src/app/models/avatar.model';

@Component({
  selector: 'app-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.scss'],
})
export class PictureComponent implements OnInit {

  constructor(
    private zone: NgZone,
    public UI: UIService,
    private modalController: ModalController
  ) { }

  ngOnInit() {}

  cancel() {
    this.modalController.dismiss();
  }

  uploadPicture(sourceType: number) {
    const options: CordovaCameraPlugin.CameraOptions = {
      quality: 90,
      destinationType: 0,
      encodingType: 0,
      mediaType: 0,
      correctOrientation: true,
      sourceType: sourceType,
      targetWidth: 256,
      targetHeight: 256
    };

    navigator.camera.getPicture((imageData) => {
      this.zone.run(() => {
        console.log('Image data', imageData);
        const avatar: Avatar = {
          contentType: 'image/jpeg',
          data : imageData,
          type : 'base64',
        };

        this.modalController.dismiss({
          avatar: avatar
        });

      });
    }, ((err) => {
      console.error(err);
      this.modalController.dismiss();
    }), options);
  }

}
