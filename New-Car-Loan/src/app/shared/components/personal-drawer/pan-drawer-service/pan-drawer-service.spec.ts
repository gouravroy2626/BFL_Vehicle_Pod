import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanDrawerService } from './pan-drawer-service';

describe('PanDrawerService', () => {
  let component: PanDrawerService;
  let fixture: ComponentFixture<PanDrawerService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanDrawerService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanDrawerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
