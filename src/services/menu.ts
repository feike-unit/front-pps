import api from './api';

export interface Menu {
  id: number;
  name: string;
  type: number; // 0-菜单，1-按钮
  parentId: number;
  path?: string;
  component?: string;
  icon?: string;
  sort: number;
  permission?: string;
  urlPattern?: string;
  method?: string;
  status: number; // 0-禁用，1-启用
  createdAt?: string;
  updatedAt?: string;
  children?: Menu[];
}

export interface MenuCreateParams {
  name: string;
  type: number;
  parentId: number;
  path?: string;
  component?: string;
  icon?: string;
  sort: number;
  permission?: string;
  urlPattern?: string;
  method?: string;
  status: number;
}

export interface MenuUpdateParams {
  id: number;
  name?: string;
  type?: number;
  parentId?: number;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  permission?: string;
  urlPattern?: string;
  method?: string;
  status?: number;
}

// 获取所有菜单
export const getAllMenus = async () => {
  const response = await api.get('/system/menus');
  return response.data;
};

// 获取当前用户菜单
export const getCurrentUserMenus = async () => {
  const response = await api.get('/system/menus/current');
  return response.data;
};

// 按类型获取菜单
export const getMenusByType = async (type: number) => {
  const response = await api.get(`/system/menus/type/${type}`);
  return response.data;
};

// 获取菜单详情
export const getMenu = async (id: number) => {
  const response = await api.get(`/system/menus/${id}`);
  return response.data;
};

// 创建菜单
export const createMenu = async (params: MenuCreateParams) => {
  const response = await api.post('/system/menus', params);
  return response.data;
};

// 更新菜单
export const updateMenu = async (params: MenuUpdateParams) => {
  const response = await api.put(`/system/menus/${params.id}`, params);
  return response.data;
};

// 删除菜单
export const deleteMenu = async (id: number) => {
  const response = await api.delete(`/system/menus/${id}`);
  return response.data;
};

// 获取角色的菜单列表
export const getRoleMenus = async (roleId: number) => {
  const response = await api.get(`/system/menus/role/${roleId}`);
  return response.data;
};

// 更新菜单状态
export const updateMenuStatus = async (id: number, status: number): Promise<Menu> => {
  const response = await api.put<Menu>(`/system/menus/${id}/status`, { status });
  return response.data;
};