import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileUserMenuComponent } from './mobile-user-menu.component';

describe('MobileUserMenuComponent', () => {
  let component: MobileUserMenuComponent;
  let fixture: ComponentFixture<MobileUserMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileUserMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileUserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
