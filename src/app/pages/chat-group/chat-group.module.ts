import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { Ionic4EmojiPickerModule } from 'ionic4-emoji-picker';
import { ChatGroupPageRoutingModule } from './chat-group-routing.module';

import { ChatGroupPage } from './chat-group.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Ionic4EmojiPickerModule,
    ChatGroupPageRoutingModule
  ],
  declarations: [ChatGroupPage]
})
export class ChatGroupPageModule {}
