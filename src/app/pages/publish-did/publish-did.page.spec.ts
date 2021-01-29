import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PublishDidPage } from './publish-did.page';

describe('PublishDidPage', () => {
  let component: PublishDidPage;
  let fixture: ComponentFixture<PublishDidPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublishDidPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PublishDidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
