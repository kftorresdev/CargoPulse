import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LanguageService],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and default to es', () => {
    expect(service).toBeTruthy();
    expect(service.currentLang()).toBe('es');
  });

  it('should toggle language between es and en', () => {
    expect(service.currentLang()).toBe('es');

    service.toggleLanguage();
    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('cargopulse_lang')).toBe('en');

    service.toggleLanguage();
    expect(service.currentLang()).toBe('es');
    expect(localStorage.getItem('cargopulse_lang')).toBe('es');
  });

  it('should set specific language and persist to localStorage', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('cargopulse_lang')).toBe('en');

    service.setLanguage('es');
    expect(service.currentLang()).toBe('es');
    expect(localStorage.getItem('cargopulse_lang')).toBe('es');
  });

  it('should translate keys correctly in es and en', () => {
    service.setLanguage('es');
    expect(service.t('navbar.subtitle')).toBe('Torre de Control');
    expect(service.t('navbar.status_connected')).toBe('Conectado');
    expect(service.t('freight_audit.export_excel')).toBe('Exportar a Excel (.xlsx)');

    service.setLanguage('en');
    expect(service.t('navbar.subtitle')).toBe('Control Tower');
    expect(service.t('navbar.status_connected')).toBe('Connected');
    expect(service.t('freight_audit.export_excel')).toBe('Export to Excel (.xlsx)');
  });

  it('should interpolate parameters in translations', () => {
    service.setLanguage('es');
    const esText = service.t('control_tower.table.displaying', { filtered: 5, total: 10 });
    expect(esText).toBe('Mostrando 5 de 10 envíos transfronterizos multimodales');

    service.setLanguage('en');
    const enText = service.t('control_tower.table.displaying', { filtered: 5, total: 10 });
    expect(enText).toBe('Displaying 5 of 10 multimodal cross-border shipments');
  });

  it('should return key if translation is missing', () => {
    expect(service.t('non.existent.key')).toBe('non.existent.key');
  });
});
