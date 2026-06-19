import type { Departamento } from '../types/organizacion';

export const departamentos: Departamento[] = [
  {
    id: 'cuerpo-ministerial',
    nombre: 'CUERPO DE APOYO MINISTERIAL',
    directiva: [
      { cargo: 'Pastor', nombre: 'NICOLA OLVERA DAVID DANIEL' },
      { cargo: 'Consejera', nombre: 'MIRANDA SANCHEZ BERTHA CORINA' },
      { cargo: 'Consejero', nombre: 'GONZALEZ RUIZ PABLO SEALARDINO' },
      { cargo: 'Consejero', nombre: 'PAÑORA RUIZ LUIS AMABLE' },
      { cargo: 'Consejera Secretaria', nombre: 'ROSALES BELTRAN FELICITA' },
      { cargo: 'Consejera Tesorero', nombre: 'MUÑOZ CARBO FRANKLIN OMAR' },
      { cargo: 'Consejero', nombre: 'MURILLO VALENCIA FRANCISCO GUSTAVO' }
    ]
  },
  {
    id: 'damas',
    nombre: 'DEPARTAMENTO DE DAMAS',
    directiva: [
      { cargo: 'Coordinadora', nombre: 'GONZALEZ FUENTES DHANIZA VERONICA' },
      { cargo: 'Sub-Coordinadora', nombre: 'ROMAN SILVA BETSABE NORENA' },
      { cargo: 'Secretaria', nombre: 'JESSENIA ISABEL LOPEZ CISNEROS' },
      { cargo: 'Tesorera', nombre: 'BARRETO GARCIA KARLA MARIUXI' },
      { cargo: 'Vocal', nombre: null },
      { cargo: 'Vocal', nombre: 'COELLO BRAVO DIXI NARCISA' },
      { cargo: 'Vocal', nombre: 'CRUZ ESPINOZA MAYRA' }
    ]
  },
  {
    id: 'caballeros',
    nombre: 'DEPARTAMENTO DE CABALLEROS',
    directiva: [
      { cargo: 'Coordinador', nombre: 'MACIAS MORA SILVIO ARTURO' },
      { cargo: 'Sub-Coordinador', nombre: 'DOMINGUEZ EDISON' },
      { cargo: 'Secretario', nombre: 'MONSERRATE VILLAMAR WELLINGTON OMAR' },
      { cargo: 'Tesorero', nombre: 'PEPPER MACIAS MARIO ENRIQUE' },
      { cargo: 'Vocal', nombre: 'RIVAS RODAS FELIPE' },
      { cargo: 'Vocal', nombre: null },
      { cargo: 'Vocal', nombre: null }
    ]
  },
  {
    id: 'jovenes',
    nombre: 'DEPARTAMENTO DE JOVENES',
    directiva: [
      { cargo: 'Coordinadora', nombre: 'AZU PERLAZA STEFFANIA ESTHER' },
      { cargo: 'Sub-Coordinador', nombre: 'BERMEO ANDREA' },
      { cargo: 'Secretaria', nombre: 'LOZANO ACHANCI DAMARIS ANAHI' },
      { cargo: 'Tesorero', nombre: 'PAÑORA QUINTANA NERY ISARAEL' },
      { cargo: 'Vocal', nombre: 'ENCALADA ADRIAN' },
      { cargo: 'Vocal', nombre: 'MASAQUIZA MACIAS BELKI JOICE' },
      { cargo: 'Vocal', nombre: 'PEREZ GONZALEZ ISAAC' }
    ]
  },
  {
    id: 'escuela-dominical',
    nombre: 'DEPARTAMENTO DE ESCUELA DOMINICAL',
    directiva: [
      { cargo: 'Superintendente', nombre: 'PLUAS RODRIGUEZ CARLOS WILFRIDO' },
      { cargo: 'Secretaria', nombre: 'VILLALTA TABITA' }
    ]
  },
  {
    id: 'cadetes',
    nombre: 'DEPARTAMENTO DE CADETES',
    directiva: [
      { cargo: 'Coordinadora', nombre: 'ALVARADO GUERRERO MARY CRUZ' },
      { cargo: 'Sub-Coordinadora', nombre: null },
      { cargo: 'Secretaria', nombre: 'MACIAS ALVARADO RAQUEL MAGDALENA' },
      { cargo: 'Tesorera', nombre: 'ARISTEGA RONQUILLO LILA DONNINA' },
      { cargo: 'Vocal', nombre: 'DELGADO DOMINGUEZ MANUEL' },
      { cargo: 'Vocal', nombre: 'PLUAS SARVIA LUCIA ALAIS' },
      { cargo: 'Vocal', nombre: 'JAIME FLORES JESSENIA MARLENE' }
    ]
  },
  {
    id: 'evangelismo-misiones',
    nombre: 'DEPARTAMENTO DE EVANGELISMO Y MISIONES',
    directiva: [
      { cargo: 'Coordinador', nombre: 'NICOLA OLVERA DAVID DANIEL' },
      { cargo: 'Sub-Coordinador', nombre: 'MASAQUIZA LOPEZ CARLOS NAPOLEON' },
      { cargo: 'Secretaria', nombre: 'ROSALES BELTRAN FELICITA' },
      { cargo: 'Tesorero', nombre: 'DELGADO DOMINGUEZ MANUEL' },
      { cargo: 'Vocal', nombre: 'DOMINGUEZ CHAVEZ EDISON' },
      { cargo: 'Vocal', nombre: null },
      { cargo: 'Vocal', nombre: null }
    ]
  }
];
