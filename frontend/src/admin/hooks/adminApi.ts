import { api } from '../../services/api';
import { pagedMeta } from '../../lib/adminQuery';

export async function fetchCitizens(params: Record<string, string | number | undefined>) {
  const res = await api.getUsers({ role: 'citizen', ...params });
  return pagedMeta(res, Number(params.page) || 1, Number(params.pageSize) || 25);
}

export async function fetchOrders(params: Record<string, string | number | undefined>) {
  const res = await api.getOrders(params);
  return pagedMeta(res, Number(params.page) || 1, Number(params.pageSize) || 25);
}

export async function fetchRewards(params: Record<string, string | number | undefined>) {
  const res = await api.getAdminRewards(params);
  return pagedMeta(res, Number(params.page) || 1, Number(params.pageSize) || 25);
}
