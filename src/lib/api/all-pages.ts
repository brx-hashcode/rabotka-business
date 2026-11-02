/** Every page of a paged list, for a screen that works on all of it at once. */
export async function allPages<T>(fetchPage: (page: number) => Promise<{ items: T[]; total: number }>) {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const res = await fetchPage(page);
    items.push(...res.items);
    if (res.items.length === 0 || items.length >= res.total) return { items, total: res.total };
  }
}
