import { AMERICA_CITIES_RAW, EUROPE_CITIES_RAW } from './city-groups';

export type GroupedCityOptions = {
  turkey: string[];
  europe: string[];
  america: string[];
};

export function buildGroupedCityOptions(turkeyCities: string[]): GroupedCityOptions {
  const trSorter = new Intl.Collator('tr').compare;
  const enSorter = new Intl.Collator('en').compare;

  const turkey = Array.from(new Set(turkeyCities.map((c) => String(c || '').trim()).filter(Boolean))).sort(trSorter);
  const turkeySet = new Set(turkey.map((c) => c.toLocaleLowerCase('tr')));

  const europe = Array.from(new Set(EUROPE_CITIES_RAW.map((c) => String(c || '').trim()).filter(Boolean)))
    .filter((c) => !turkeySet.has(c.toLocaleLowerCase('tr')))
    .sort(enSorter);

  const america = Array.from(new Set(AMERICA_CITIES_RAW.map((c) => String(c || '').trim()).filter(Boolean)))
    .filter((c) => !turkeySet.has(c.toLocaleLowerCase('tr')))
    .sort(enSorter);

  return { turkey, europe, america };
}
