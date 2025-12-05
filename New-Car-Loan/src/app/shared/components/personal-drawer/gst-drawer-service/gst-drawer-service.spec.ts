import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GstDrawerService } from './gst-drawer-service';

describe('GstDrawerService', () => {
  let component: GstDrawerService;
  let fixture: ComponentFixture<GstDrawerService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GstDrawerService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GstDrawerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
