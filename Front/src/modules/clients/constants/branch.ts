export const BRANCH_CITIES = [
  'Medellin',
  'Bello',
  'Sabaneta',
  'Girardota',
  'Copacabana',
  'Itagui',
  'Envigado',
  'Caldas',
  'La Estrella',
  'Barbosa',
] as const;

export type BranchCity = (typeof BRANCH_CITIES)[number];

export const PRICING_MODES = {
  fixed: 'fixed',
  squareMeter: 'square_meter',
} as const;

export type PricingMode = (typeof PRICING_MODES)[keyof typeof PRICING_MODES];
