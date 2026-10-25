import { describe, expect, it } from 'vitest';
import { isPublicPathVisible } from './publicLaunchVisibility';
import { useSiteFeatureVisibilityStore } from '../store/useSiteFeatureVisibilityStore';

describe('visibilidad de secciones públicas', () => {
  it('mantiene ocultos tienda, carrito y aula mientras se siguen desarrollando', () => {
    const productionVisibility = { store: false, classroom: false };
    expect(isPublicPathVisible('/tienda', productionVisibility)).toBe(false);
    expect(isPublicPathVisible('/tienda/producto/1', productionVisibility)).toBe(false);
    expect(isPublicPathVisible('/cart', productionVisibility)).toBe(false);
    expect(isPublicPathVisible('/aula-virtual', productionVisibility)).toBe(false);
  });

  it('deja disponibles los destinos públicos y las herramientas de administración', () => {
    expect(isPublicPathVisible('/programas', { store: false, classroom: false })).toBe(true);
    expect(isPublicPathVisible('/admin/tienda', { store: false, classroom: false })).toBe(true);
    expect(isPublicPathVisible('/admin/aula-virtual', { store: false, classroom: false })).toBe(true);
  });

  it('permite mostrar las secciones al habilitarlas desde administración', () => {
    expect(isPublicPathVisible('/tienda', { store: true, classroom: true })).toBe(true);
    expect(isPublicPathVisible('/aula-virtual', { store: true, classroom: true })).toBe(true);
  });

  it('usa el estado vigente al filtrar enlaces de navegación', () => {
    useSiteFeatureVisibilityStore.setState({ visibility: { store: false, classroom: false, adminOnboarding: false, toolbox: false } });
    expect(isPublicPathVisible('/tienda')).toBe(false);
    useSiteFeatureVisibilityStore.setState({ visibility: { store: true, classroom: true, adminOnboarding: false, toolbox: false } });
    expect(isPublicPathVisible('/tienda')).toBe(true);
    expect(isPublicPathVisible('/aula-virtual')).toBe(true);
    useSiteFeatureVisibilityStore.setState({ visibility: { store: false, classroom: false, adminOnboarding: false, toolbox: false } });
  });
});
