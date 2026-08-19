export interface PresentationConfig {
  id: string;
  label: string;
  icon: string;
  unitNounSingular: string;
  unitNounPlural: string;
  defaultTrackingMode: 'pieces' | 'manual_bottle';
  stockCountLabel: string;
  unitsPerBoxLabel: string;
  lowStockLabel: string;
  bottleCountLabel: string;
  bottleHint: string;
  doseOptions: Array<{ value: number; label: string }>;
}

export function getPresentationConfig(presentationKey: string = 'tablet', lang: 'es' | 'en' = 'es'): PresentationConfig {
  const isEn = lang === 'en';
  const key = (presentationKey || 'tablet').toLowerCase();

  switch (key) {
    case 'drops':
      return {
        id: 'drops',
        label: isEn ? 'Eye Drops' : 'Gotas Oftálmicas (Ojos)',
        icon: '👁️',
        unitNounSingular: isEn ? 'drop' : 'gota',
        unitNounPlural: isEn ? 'drops' : 'gotas',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Bottles in Stock' : 'Goteros / Frascos en Existencia',
        unitsPerBoxLabel: isEn ? 'Bottles per Box' : 'Frascos por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Dropper Bottles in Stock:' : 'Cantidad de Frascos / Goteros Disponibles:',
        bottleHint: isEn ? 'e.g. 1 in use, 1 in reserve' : 'ej. 1 gotero en uso y 1 frasco de reserva en el botiquín.',
        doseOptions: [
          { value: 1, label: isEn ? '1 drop' : '1 gota' },
          { value: 2, label: isEn ? '2 drops' : '2 gotas' },
          { value: 3, label: isEn ? '3 drops' : '3 gotas' },
          { value: 4, label: isEn ? '4 drops' : '4 gotas' }
        ]
      };

    case 'ear_drops':
      return {
        id: 'ear_drops',
        label: isEn ? 'Ear Drops' : 'Gotas Óticas (Oídos)',
        icon: '👂',
        unitNounSingular: isEn ? 'drop' : 'gota',
        unitNounPlural: isEn ? 'drops' : 'gotas',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Bottles in Stock' : 'Frascos Óticos en Existencia',
        unitsPerBoxLabel: isEn ? 'Bottles per Box' : 'Frascos por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Ear Drop Bottles:' : 'Cantidad de Frascos Óticos Disponibles:',
        bottleHint: isEn ? 'e.g. 1 bottle in use' : 'ej. 1 gotero en uso.',
        doseOptions: [
          { value: 1, label: isEn ? '1 drop' : '1 gota' },
          { value: 2, label: isEn ? '2 drops' : '2 gotas' },
          { value: 3, label: isEn ? '3 drops' : '3 gotas' },
          { value: 4, label: isEn ? '4 drops' : '4 gotas' },
          { value: 5, label: isEn ? '5 drops' : '5 gotas' }
        ]
      };

    case 'nasal_spray':
      return {
        id: 'nasal_spray',
        label: isEn ? 'Nasal Spray' : 'Spray / Gotas Nasales',
        icon: '👃',
        unitNounSingular: isEn ? 'spray' : 'disparo',
        unitNounPlural: isEn ? 'sprays' : 'disparos',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Sprays in Stock' : 'Sprays / Atomizadores en Existencia',
        unitsPerBoxLabel: isEn ? 'Sprays per Box' : 'Atomizadores por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Nasal Spray Bottles:' : 'Cantidad de Atomizadores / Frascos Disponibles:',
        bottleHint: isEn ? 'e.g. 1 spray in use' : 'ej. 1 atomizador en uso.',
        doseOptions: [
          { value: 1, label: isEn ? '1 spray per nostril' : '1 disparo en cada fosa nasal' },
          { value: 2, label: isEn ? '2 sprays per nostril' : '2 disparos en cada fosa nasal' }
        ]
      };

    case 'syrup':
      return {
        id: 'syrup',
        label: isEn ? 'Syrup / Suspension' : 'Jarabe / Suspensión Líquida',
        icon: '🥄',
        unitNounSingular: isEn ? 'bottle / ml' : 'frasco / ml',
        unitNounPlural: isEn ? 'bottles / ml' : 'frascos / ml',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Syrup Bottles in Stock' : 'Frascos de Jarabe en Existencia',
        unitsPerBoxLabel: isEn ? 'Bottles per Box' : 'Frascos por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Syrup Bottles:' : 'Cantidad de Frascos de Jarabe Disponibles:',
        bottleHint: isEn ? 'e.g. 1 bottle in use (120ml)' : 'ej. 1 frasco de 120ml en uso y 1 en reserva.',
        doseOptions: [
          { value: 2.5, label: '2.5 ml' },
          { value: 5, label: isEn ? '5 ml (1 teaspoon)' : '5 ml (1 cucharadita)' },
          { value: 7.5, label: '7.5 ml' },
          { value: 10, label: isEn ? '10 ml (1 tablespoon)' : '10 ml (1 cucharada)' },
          { value: 15, label: '15 ml' },
          { value: 20, label: '20 ml' }
        ]
      };

    case 'cream':
      return {
        id: 'cream',
        label: isEn ? 'Cream / Ointment' : 'Crema / Pomada / Gel / Ungüento',
        icon: '🧴',
        unitNounSingular: isEn ? 'tube' : 'tubo',
        unitNounPlural: isEn ? 'tubes' : 'tubos / pomadas',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Tubes in Stock' : 'Tubos de Pomada en Existencia',
        unitsPerBoxLabel: isEn ? 'Tubes per Box' : 'Tubos por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Cream / Ointment Tubes:' : 'Cantidad de Tubos / Pomadas Disponibles:',
        bottleHint: isEn ? 'e.g. 1 tube in use' : 'ej. 1 tubo en uso y 1 de reserva.',
        doseOptions: [
          { value: 1, label: isEn ? '1 application' : '1 aplicación en zona afectada' },
          { value: 2, label: isEn ? '2 applications' : '2 aplicaciones' }
        ]
      };

    case 'sachet':
      return {
        id: 'sachet',
        label: isEn ? 'Sachet / Soluble Powder' : 'Sobre / Polvo Soluble',
        icon: '🍵',
        unitNounSingular: isEn ? 'sachet' : 'sobre',
        unitNounPlural: isEn ? 'sachets' : 'sobres',
        defaultTrackingMode: 'pieces',
        stockCountLabel: isEn ? 'Sachets in Stock' : 'Sobres en Existencia',
        unitsPerBoxLabel: isEn ? 'Sachets per Box' : 'Sobres por Caja',
        lowStockLabel: isEn ? 'Alert when remaining sachets <' : 'Alerta si quedan menos de',
        bottleCountLabel: isEn ? 'Boxes in Stock:' : 'Cajas de Sobres Disponibles:',
        bottleHint: isEn ? 'e.g. 10 sachets' : 'ej. 1 caja con 14 sobres.',
        doseOptions: [
          { value: 0.5, label: isEn ? '1/2 sachet' : '1/2 sobre' },
          { value: 1, label: isEn ? '1 sachet' : '1 sobre disuelto en agua' },
          { value: 2, label: isEn ? '2 sachets' : '2 sobres disueltos en agua' }
        ]
      };

    case 'inhalation':
      return {
        id: 'inhalation',
        label: isEn ? 'Inhaler / Puffs' : 'Inhalador / Aerosol (Disparos)',
        icon: '🫁',
        unitNounSingular: isEn ? 'inhaler' : 'inhalador',
        unitNounPlural: isEn ? 'inhalers' : 'inhaladores',
        defaultTrackingMode: 'manual_bottle',
        stockCountLabel: isEn ? 'Inhalers in Stock' : 'Inhaladores en Existencia',
        unitsPerBoxLabel: isEn ? 'Inhalers per Box' : 'Inhaladores por Caja',
        lowStockLabel: isEn ? 'Alert when' : 'Alerta al quedar',
        bottleCountLabel: isEn ? 'Available Inhalers / Canisters:' : 'Cantidad de Inhaladores / Cartuchos Disponibles:',
        bottleHint: isEn ? 'e.g. 1 inhaler in use' : 'ej. 1 inhalador de 200 dosis en uso.',
        doseOptions: [
          { value: 1, label: isEn ? '1 puff' : '1 disparo / inhalación' },
          { value: 2, label: isEn ? '2 puffs' : '2 disparos / inhalaciones' },
          { value: 3, label: isEn ? '3 puffs' : '3 disparos / inhalaciones' }
        ]
      };

    case 'injection':
      return {
        id: 'injection',
        label: isEn ? 'Injection / Ampoule' : 'Inyectable / Ampolleta',
        icon: '💉',
        unitNounSingular: isEn ? 'ampoule' : 'ampolleta',
        unitNounPlural: isEn ? 'ampoules' : 'ampolletas',
        defaultTrackingMode: 'pieces',
        stockCountLabel: isEn ? 'Ampoules in Stock' : 'Ampolletas / Jeringas en Existencia',
        unitsPerBoxLabel: isEn ? 'Ampoules per Box' : 'Ampolletas por Caja',
        lowStockLabel: isEn ? 'Alert when remaining ampoules <' : 'Alerta si quedan menos de',
        bottleCountLabel: isEn ? 'Vials in Stock:' : 'Frascos ámpula Disponibles:',
        bottleHint: isEn ? 'e.g. 5 ampoules per box' : 'ej. 1 caja con 5 ampolletas o jeringas.',
        doseOptions: [
          { value: 1, label: isEn ? '1 ampoule / injection' : '1 ampolleta / inyección' },
          { value: 2, label: isEn ? '2 ampoules' : '2 ampolletas' },
          { value: 5, label: isEn ? '5 Units (Insulin)' : '5 Unidades (Insulina)' },
          { value: 10, label: isEn ? '10 Units (Insulin)' : '10 Unidades (Insulina)' },
          { value: 15, label: isEn ? '15 Units (Insulin)' : '15 Unidades (Insulina)' },
          { value: 20, label: isEn ? '20 Units (Insulin)' : '20 Unidades (Insulina)' },
          { value: 30, label: isEn ? '30 Units (Insulin)' : '30 Unidades (Insulina)' }
        ]
      };

    case 'patch':
      return {
        id: 'patch',
        label: isEn ? 'Transdermal Patch' : 'Parche Transdérmico',
        icon: '🩹',
        unitNounSingular: isEn ? 'patch' : 'parche',
        unitNounPlural: isEn ? 'patches' : 'parches',
        defaultTrackingMode: 'pieces',
        stockCountLabel: isEn ? 'Patches in Stock' : 'Parches en Existencia',
        unitsPerBoxLabel: isEn ? 'Patches per Box' : 'Parches por Caja',
        lowStockLabel: isEn ? 'Alert when remaining patches <' : 'Alerta si quedan menos de',
        bottleCountLabel: isEn ? 'Boxes of Patches:' : 'Cajas de Parches Disponibles:',
        bottleHint: isEn ? 'e.g. 1 box with 5 patches' : 'ej. 1 caja con 5 parches.',
        doseOptions: [
          { value: 0.5, label: isEn ? '1/2 patch' : '1/2 parche' },
          { value: 1, label: isEn ? '1 patch' : '1 parche adherido' },
          { value: 2, label: isEn ? '2 patches' : '2 parches' }
        ]
      };

    case 'capsule':
      return {
        id: 'capsule',
        label: isEn ? 'Capsule' : 'Cápsula',
        icon: '💊',
        unitNounSingular: isEn ? 'capsule' : 'cápsula',
        unitNounPlural: isEn ? 'capsules' : 'cápsulas',
        defaultTrackingMode: 'pieces',
        stockCountLabel: isEn ? 'Capsules in Stock' : 'Cápsulas en Existencia',
        unitsPerBoxLabel: isEn ? 'Capsules per Box' : 'Cápsulas por Caja',
        lowStockLabel: isEn ? 'Alert when remaining capsules <' : 'Alerta si quedan menos de',
        bottleCountLabel: isEn ? 'Bottles of Capsules:' : 'Frascos de Cápsulas:',
        bottleHint: isEn ? 'e.g. 1 bottle of 60 capsules' : 'ej. 1 frasco con 60 cápsulas.',
        doseOptions: [
          { value: 1, label: isEn ? '1 capsule' : '1 cápsula' },
          { value: 2, label: isEn ? '2 capsules' : '2 cápsulas' },
          { value: 3, label: isEn ? '3 capsules' : '3 cápsulas' }
        ]
      };

    case 'tablet':
    default:
      return {
        id: 'tablet',
        label: isEn ? 'Tablet / Pill' : 'Tableta / Pastilla',
        icon: '💊',
        unitNounSingular: isEn ? 'tablet' : 'tableta',
        unitNounPlural: isEn ? 'tabletas' : 'tabletas / pastillas',
        defaultTrackingMode: 'pieces',
        stockCountLabel: isEn ? 'Tablets / Pills in Stock' : 'Tabletas / Pastillas en Existencia',
        unitsPerBoxLabel: isEn ? 'Tablets per Box' : 'Tabletas por Caja',
        lowStockLabel: isEn ? 'Alert when remaining tablets <' : 'Alerta si quedan menos de',
        bottleCountLabel: isEn ? 'Bottles of Tablets:' : 'Frascos de Pastillas:',
        bottleHint: isEn ? 'e.g. 1 bottle of 100 tablets' : 'ej. 1 frasco con 100 pastillas.',
        doseOptions: [
          { value: 0.25, label: isEn ? '1/4 tablet' : '1/4 tableta' },
          { value: 0.5, label: isEn ? '1/2 tablet' : '1/2 tableta' },
          { value: 0.75, label: isEn ? '3/4 tablet' : '3/4 tableta' },
          { value: 1, label: isEn ? '1 tablet' : '1 tableta' },
          { value: 1.5, label: isEn ? '1 1/2 tablets' : '1 1/2 tabletas' },
          { value: 2, label: isEn ? '2 tablets' : '2 tabletas' },
          { value: 3, label: isEn ? '3 tablets' : '3 tabletas' }
        ]
      };
  }
}
