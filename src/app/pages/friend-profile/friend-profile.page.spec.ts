import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FriendProfilePage } from './friend-profile.page';

describe('FriendProfilePage', () => {
  let component: FriendProfilePage;
  let fixture: ComponentFixture<FriendProfilePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FriendProfilePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FriendProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
