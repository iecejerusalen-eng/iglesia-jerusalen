export interface PastorEra {
  id: string;
  names: string;
  period: string;
  role: string;
  description: string;
  image: string;
  original: string;
}

const portrait = (id: string) => `/images/historia/pastores/${id}-estudio-v01.webp`;
const original = (id: string) => `/images/historia/pastores/${id}-original.webp`;

export const pastoralEras: PastorEra[] = [
  { id: 'cristobal-caceres-carmen-croll', names: 'Cristóbal Cáceres y Carmen Croll', period: 'Desde 1961', role: 'Los primeros pasos en Milagro', description: 'Llegaron a Ecuador con sus cuatro hijos el 26 de octubre de 1961. Acompañaron el nacimiento de la congregación y la construcción del primer templo.', image: portrait('cristobal-caceres-carmen-croll'), original: original('cristobal-caceres-carmen-croll') },
  { id: 'carlos-armijos-luz-maria-mutre', names: 'Carlos Armijos y Luz María Mutre', period: 'Después de la familia Cáceres', role: 'Continuidad pastoral', description: 'Recibieron la responsabilidad pastoral después del traslado de Cristóbal Cáceres a Guayaquil. Su servicio forma parte de la consolidación de la iglesia local.', image: portrait('carlos-armijos-luz-maria-mutre'), original: original('carlos-armijos-luz-maria-mutre') },
  { id: 'silvio-rosado-lubertina-murillo', names: 'Silvio Rosado y Lubertina Murillo', period: 'Después de la familia Armijos', role: 'Una comunidad que crece', description: 'Continuaron el acompañamiento de la congregación durante los años del primer templo, dando continuidad a la enseñanza y al cuidado de las familias.', image: portrait('silvio-rosado-lubertina-murillo'), original: original('silvio-rosado-lubertina-murillo') },
  { id: 'maximo-sanchez-jenny-castro', names: 'Máximo Sánchez y Jenny Castro', period: 'Hasta 1988', role: 'Un servicio que deja huella', description: 'Guiaron la iglesia después de la familia Rosado. En 1988 concluyó esta etapa y Humberto Acero asumió la dirección de la congregación.', image: portrait('maximo-sanchez-jenny-castro'), original: original('maximo-sanchez-jenny-castro') },
  { id: 'humberto-acero-teresa-penafiel', names: 'Humberto Acero y Teresa Peñafiel', period: '1988–2020', role: 'La casa que hoy nos reúne', description: 'Humberto asumió la dirección en 1988 y fue nombrado pastor titular el 30 de enero de 1989. Durante su ministerio se inauguró el templo actual, el 26 de octubre de 2009. Su labor concluyó el 12 de enero de 2020.', image: portrait('humberto-acero-teresa-penafiel'), original: original('humberto-acero-teresa-penafiel') },
  { id: 'david-nicola-corina-miranda', names: 'David Nicola y Corina Miranda', period: 'Desde 2020', role: 'Seguimos escribiendo esta historia', description: 'David Nicola Olvera y Corina Miranda Sánchez sucedieron a Humberto Acero y Teresa Peñafiel en enero de 2020. Acompañan a la iglesia en su misión de anunciar a Jesucristo y servir a la comunidad.', image: portrait('david-nicola-corina-miranda'), original: original('david-nicola-corina-miranda') },
];

export const assistantPastors: PastorEra = {
  id: 'freddy-loor-jeannyna-vega', names: 'Freddy Loor y Jeannyna Vega', period: '2012–enero de 2024', role: 'Pastores asistentes', description: 'Acompañaron la vida y el servicio de la congregación como pastores asistentes. Su labor se desarrolló junto al liderazgo principal durante este período.', image: portrait('freddy-loor-jeannyna-vega'), original: original('freddy-loor-jeannyna-vega'),
};

export const historyMilestones = [
  { year: '1956', date: 'La misión llega a Ecuador', title: 'Una semilla de fe', text: 'Los esposos Gadberry, enviados desde Los Ángeles, iniciaron la obra misionera. Los esposos Aguirre se sumaron para fortalecer la misión en el país.' },
  { year: '1961', date: '26 de octubre', title: 'Una familia responde al llamado', text: 'Cristóbal Cáceres y Carmen Croll desembarcaron en Guayaquil con sus cuatro hijos. En Milagro les esperaba un grupo de creyentes que había solicitado acompañamiento pastoral.', image: portrait('cristobal-caceres-carmen-croll'), alt: 'Retrato restaurado de Cristóbal Cáceres y Carmen Croll' },
  { year: '1961', date: '31 de diciembre', title: 'Un nuevo comienzo, juntos', text: 'Tras una diferencia con el grupo inicial, varias familias acompañaron al pastor Cáceres. Continuaron el culto en casa de Virginia Tucunango y, después de reunirse en distintos lugares, se establecieron en la calle 5 de Junio.' },
  { year: '1967', date: 'Construcción · inauguración a inicios de 1968', title: 'El primer templo', text: 'La congregación levantó su templo en el terreno donde hoy se encuentra la Unidad Educativa Jerusalén. Durante 41 años, ese lugar recibió a la comunidad.' },
  { year: '1988', date: 'Nombramiento formal: 30 de enero de 1989', title: 'Una nueva etapa pastoral', text: 'Humberto Acero Barreno asumió la dirección después de Máximo Sánchez. El pastor Amable Torres lo nombró oficialmente pastor titular en 1989.', image: portrait('humberto-acero-teresa-penafiel'), alt: 'Retrato restaurado de Humberto Acero y Teresa Peñafiel' },
  { year: '2009', date: '26 de octubre', title: 'Jerusalén abre las puertas de su nueva casa', text: 'Bajo el ministerio de Humberto Acero y Teresa Peñafiel se inauguró el templo actual, con el nombre Iglesia del Evangelio Cuadrangular Jerusalén.', image: '/images/cuadrangular/fachada-jerusalen-v03.jpg', alt: 'Fachada limpia de la Iglesia del Evangelio Cuadrangular Jerusalén, en Milagro' },
  { year: '2020', date: '12 de enero', title: 'Un legado que continúa', text: 'Humberto Acero y Teresa Peñafiel concluyeron su labor ministerial. David Nicola Olvera y Corina Miranda Sánchez recibieron la responsabilidad pastoral.', image: portrait('david-nicola-corina-miranda'), alt: 'Retrato de estudio de David Nicola y Corina Miranda' },
];
