import { APP_INITIALIZER, ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router, RouteReuseStrategy, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { QRCodeModule } from 'angularx-qrcode';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppService } from './services/AppService';
import { CarrierService } from './services/CarrierService';
import { EventService } from './services/EventService';
import { FriendService } from './services/FriendService';
import { MessageService } from './services/MessageService';
import { GroupMessageService } from './services/GroupMessageSerivce';
import { HiveService } from './services/HiveService';
import { GroupService } from './services/GroupService';
import { StorageService } from './services/StorageService';
import { NativeService } from './services/native.service';
import { UIService } from './services/ui.service';
import { SplashPage } from './pages/splash/splash.page';
import { PopupMyaddressComponent } from './components/popup-myaddress/popup-myaddress.component';
import { OptionsComponent } from './components/options/options.component';
import { PictureComponent } from './components/picture/picture.component';
import { SelectComponent } from './components/select/select.component';
import { InviteSuccessComponent } from './components/invite-success/invite-success.component';
import { MessageActionComponent } from './components/message-action/message-action.component';
import { GroupInviteComponent } from './components/group-invite/group-invite.component';
import { ContactDetailsComponent } from './components/contact-details/contact-details.component';
import { ContactRespondComponent } from './components/contact-respond/contact-respond.component';
import * as Sentry from "@sentry/browser";
import { RewriteFrames } from '@sentry/integrations';
import { GroupActionComponent } from './components/group-action/group-action.component';

Sentry.init({
    dsn: "https://c3e2a4dda7c14bb186d6166377c00f45@sentry.io/5510783",
    release: "default",
    integrations: [
      new RewriteFrames(),
    ]
  });

  @Injectable({
    providedIn: "root"
    })
  export class SentryErrorHandler implements ErrorHandler {
  
    constructor(public alertCtrl: AlertController) {}
  
    handleError(error) {
      console.error("Globally catched exception:", error);
  
      console.log(document.URL);
      // Only send reports to sentry if we are not debugging.
        const hyperPackageId = "com.hyper.messenger";
        //const hyperPackageId = "192.168.56.1:8100";
      if (document.URL.includes(hyperPackageId)) { // Prod builds or --nodebug CLI builds use the app package id instead of a local IP
          /*const eventId = */ Sentry.captureException(error.originalError || error);
          //Sentry.showReportDialog({ eventId });
      }
      this.ionicAlert("Error", "Sorry, the application encountered an error. This has been reported to the team.", "Close");
    }
  
    public async ionicAlert(title: string, subTitle?: string, okText?: string) {
      const alert = await this.alertCtrl.create({
          header : title,
          subHeader: subTitle,
          backdropDismiss: false,
          buttons: [{
              text: okText,
              handler: () => {
                  
              }
          }]
      });
      await alert.present();
    };

    public notify(error: any) {
        Sentry.captureException(error);
    }
  }

@NgModule({
    declarations: [
        AppComponent,
        PopupMyaddressComponent,
        OptionsComponent,
        PictureComponent,
        SelectComponent,
        InviteSuccessComponent,
        MessageActionComponent,
        GroupActionComponent,
        GroupInviteComponent,
        ContactDetailsComponent,
        ContactRespondComponent,
        SplashPage
    ],
    entryComponents: [
        PopupMyaddressComponent,
        OptionsComponent,
        PictureComponent,
        SelectComponent,
        InviteSuccessComponent,
        MessageActionComponent,
        GroupActionComponent,
        GroupInviteComponent,
        ContactDetailsComponent,
        ContactRespondComponent,
        SplashPage
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        QRCodeModule,
        FormsModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        { provide: ErrorHandler, useClass: SentryErrorHandler },
        Clipboard,
        AppService,
        EventService,
        CarrierService,
        HiveService,
        FriendService,
        MessageService,
        GroupService,
        GroupMessageService,
        StorageService,
        NativeService,
        UIService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
