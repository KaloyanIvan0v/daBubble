import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnProfileEditComponent } from './own-profile-edit.component';

describe('OwnProfileEditComponent', () => {
  let component: OwnProfileEditComponent;
  let fixture: ComponentFixture<OwnProfileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnProfileEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
