/** Deals items out left to right, so the columns keep the list's reading order. */
export function spreadIntoColumns<T>(items: T[], count: number): T[][] {
  const columns: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push(item));
  return columns.filter((column) => column.length > 0);
}
