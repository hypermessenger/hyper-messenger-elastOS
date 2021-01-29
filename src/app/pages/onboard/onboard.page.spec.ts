import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OnboardPage } from './onboard.page';

describe('OnboardPage', () => {
  let component: OnboardPage;
  let fixture: ComponentFixture<OnboardPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnboardPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
