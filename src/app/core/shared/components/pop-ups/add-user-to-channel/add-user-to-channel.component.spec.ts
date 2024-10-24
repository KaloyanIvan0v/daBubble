import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToChannelComponent } from './add-user-to-channel.component';

describe('AddUserToChannelComponent', () => {
  let component: AddUserToChannelComponent;
  let fixture: ComponentFixture<AddUserToChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserToChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserToChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
