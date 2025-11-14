import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAggregator } from './account-aggregator';

describe('AccountAggregator', () => {
  let component: AccountAggregator;
  let fixture: ComponentFixture<AccountAggregator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountAggregator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountAggregator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
