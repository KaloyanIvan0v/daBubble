import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftSideComponentComponent } from './left-side-component.component';

describe('LeftSideComponentComponent', () => {
  let component: LeftSideComponentComponent;
  let fixture: ComponentFixture<LeftSideComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftSideComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeftSideComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
