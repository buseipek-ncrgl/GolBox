export function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
};

export const pagedMeta = (res: any, fallbackPage = 1, fallbackSize = 25) => ({
  items: extractArray(res),
  page: Number(res?.page ?? fallbackPage),
  pageSize: Number(res?.pageSize ?? fallbackSize),
  totalCount: Number(res?.totalCount ?? extractArray(res).length)
});
