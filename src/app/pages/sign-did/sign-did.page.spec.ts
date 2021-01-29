import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SignDidPage } from './sign-did.page';

describe('SignDidPage', () => {
  let component: SignDidPage;
  let fixture: ComponentFixture<SignDidPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignDidPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SignDidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
