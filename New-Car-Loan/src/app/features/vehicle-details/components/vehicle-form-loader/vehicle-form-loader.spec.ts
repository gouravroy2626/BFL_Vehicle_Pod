import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleFormLoader } from './vehicle-form-loader';

describe('VehicleFormLoader', () => {
  let component: VehicleFormLoader;
  let fixture: ComponentFixture<VehicleFormLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleFormLoader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleFormLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
