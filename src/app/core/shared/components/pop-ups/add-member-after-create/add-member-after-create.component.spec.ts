import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMemberAfterCreateComponent } from './add-member-after-create.component';

describe('AddMemberAfterCreateComponent', () => {
  let component: AddMemberAfterCreateComponent;
  let fixture: ComponentFixture<AddMemberAfterCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMemberAfterCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMemberAfterCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
