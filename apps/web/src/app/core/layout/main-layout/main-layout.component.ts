import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <!-- Sticky Navbar -->
      <app-navbar class="shrink-0" />

      <!-- Main Shell with Sidebar + Scrollable Viewport -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Collapsible Sidebar -->
        <app-sidebar class="shrink-0" />

        <!-- Scrollable Router Outlet Content Area -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div class="max-w-7xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
