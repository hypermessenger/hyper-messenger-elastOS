import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EditInfoPage } from './edit-info.page';

describe('EditInfoPage', () => {
  let component: EditInfoPage;
  let fixture: ComponentFixture<EditInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditInfoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EditInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
