import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnProfileViewComponent } from './own-profile-view.component';

describe('OwnProfileViewComponent', () => {
  let component: OwnProfileViewComponent;
  let fixture: ComponentFixture<OwnProfileViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnProfileViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnProfileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
