import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMembersViewComponent } from './channel-members-view.component';

describe('ChannelMembersViewComponent', () => {
  let component: ChannelMembersViewComponent;
  let fixture: ComponentFixture<ChannelMembersViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMembersViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelMembersViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
