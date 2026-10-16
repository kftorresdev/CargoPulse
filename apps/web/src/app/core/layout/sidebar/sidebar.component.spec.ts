import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with isCollapsed set to false', () => {
    expect(component.isCollapsed()).toBe(false);
  });

  it('should toggle collapse state when toggleCollapse is called', () => {
    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(true);

    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(false);
  });

  it('should render navigation links for all 4 features', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBe(4);

    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/control-tower');
    expect(hrefs).toContain('/freight-audit');
    expect(hrefs).toContain('/alert-center');
    expect(hrefs).toContain('/shipments');
  });
});
