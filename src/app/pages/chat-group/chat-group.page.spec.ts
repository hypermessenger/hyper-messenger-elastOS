import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ChatGroupPage } from './chat-group.page';

describe('ChatGroupPage', () => {
  let component: ChatGroupPage;
  let fixture: ComponentFixture<ChatGroupPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatGroupPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatGroupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
