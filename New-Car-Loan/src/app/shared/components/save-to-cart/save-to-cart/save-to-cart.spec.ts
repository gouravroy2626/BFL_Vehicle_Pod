import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveToCart } from './save-to-cart';

describe('SaveToCart', () => {
  let component: SaveToCart;
  let fixture: ComponentFixture<SaveToCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveToCart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveToCart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
