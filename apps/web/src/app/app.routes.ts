import { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ControlTowerComponent } from './features/control-tower/control-tower.component';
import { FreightAuditComponent } from './features/freight-audit/freight-audit.component';
import { AlertCenterComponent } from './features/alert-center/alert-center.component';
import { ShipmentsComponent } from './features/shipments/shipments.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'control-tower',
        component: ControlTowerComponent
      },
      {
        path: 'freight-audit',
        component: FreightAuditComponent
      },
      {
        path: 'alert-center',
        component: AlertCenterComponent
      },
      {
        path: 'shipments',
        component: ShipmentsComponent
      },
      {
        path: '',
        redirectTo: 'control-tower',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'control-tower'
  }
];
