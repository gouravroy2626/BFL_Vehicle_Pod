import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawerComponent } from './drawer';

describe('DrawerComponent', () => {
  let component: DrawerComponent;
  let fixture: ComponentFixture<DrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed event on closeDrawer', () => {
    spyOn(component.closed, 'emit');
    component.closeDrawer();
    expect(component.closed.emit).toHaveBeenCalled();
  });
});
