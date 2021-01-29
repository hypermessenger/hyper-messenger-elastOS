import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RegisterHivePage } from './register-hive.page';

describe('RegisterHivePage', () => {
  let component: RegisterHivePage;
  let fixture: ComponentFixture<RegisterHivePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegisterHivePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterHivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
