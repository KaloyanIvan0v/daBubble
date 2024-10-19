import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightSideContainerComponent } from './right-side-container.component';

describe('RightSideContainerComponent', () => {
  let component: RightSideContainerComponent;
  let fixture: ComponentFixture<RightSideContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightSideContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightSideContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
