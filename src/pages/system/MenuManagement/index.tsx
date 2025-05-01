import React, { useRef } from 'react';
import {
  Button,
  Space,
  Switch,
  message,
  Popconfirm,
  TreeSelect,
  Tooltip,
  Table,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown, ModalForm, ProForm, ProFormText, ProFormSelect, ProFormTreeSelect, ProFormDigit, ProFormSwitch } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Menu, getAllMenus, createMenu, updateMenu, deleteMenu, updateMenuStatus } from '../../../services/menu';
import { ApiError } from '../../../services/api';

const MenuManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentMenu, setCurrentMenu] = React.useState<Menu | null>(null);
  const [treeData, setTreeData] = React.useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = React.useState<number[]>([]);

  // 将菜单列表转换为树形结构
  const convertToTreeData = (data: Menu[]): Menu[] => {
    const map = new Map<number, Menu>();
    const result: Menu[] = [];

    // 先创建所有节点的副本
    data.forEach(menu => {
      map.set(menu.id, { ...menu, children: [] });
    });

    // 构建树形结构
    data.forEach(menu => {
      const node = map.get(menu.id)!;
      if (menu.parentId === 0) {
        result.push(node);
      } else {
        const parent = map.get(menu.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return result;
  };

  // 将菜单列表转换为TreeSelect需要的数据格式
  const formatTreeSelectData = (data: Menu[]): any[] => {
    return data.map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children && item.children.length > 0 
        ? formatTreeSelectData(item.children) 
        : undefined,
    }));
  };

  // 保存菜单
  const handleSaveMenu = async (values: any) => {
    try {
      const params = {
        ...values,
        status: values.status ? 1 : 0,
      };
      
      if (currentMenu) {
        await updateMenu({ id: currentMenu.id, ...params });
        message.success('菜单更新成功');
      } else {
        await createMenu(params);
        message.success('菜单创建成功');
      }
      actionRef.current?.reload();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存菜单失败');
      return false;
    }
  };

  // 删除菜单
  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success('菜单删除成功');
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除菜单失败');
    }
  };

  // 更新菜单状态
  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      const status = checked ? 1 : 0;
      const statusText = status === 1 ? '启用' : '禁用';
      await updateMenuStatus(id, status);
      message.success(`菜单${statusText}成功，已同步更新所有子菜单状态`);
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '状态更新失败');
    }
  };

  const columns: ProColumns<Menu>[] = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      copyable: true,
      render: (_, record) => record.name,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        0: { text: '菜单' },
        1: { text: '按钮' },
      },
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '组件',
      dataIndex: 'component',
      key: 'component',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      search: false,
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
      key: 'permission',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checkedChildren="启用"
          unCheckedChildren="禁用"
          checked={record.status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<Menu>
            key="edit"
            title="编辑菜单"
            trigger={
              <Button type="link" style={{ padding: 0 }}>
                <EditOutlined />
              </Button>
            }
            initialValues={{
              ...record,
              status: record.status === 1,
            }}
            onFinish={handleSaveMenu}
            modalProps={{
              destroyOnClose: true,
            }}
            width={700}
          >
            <ProForm.Group>
              <ProFormText
                name="name"
                label="菜单名称"
                rules={[{ required: true, message: '请输入菜单名称' }]}
                width="md"
              />
              <ProFormSelect
                name="type"
                label="菜单类型"
                rules={[{ required: true, message: '请选择菜单类型' }]}
                options={[
                  { label: '菜单', value: 0 },
                  { label: '按钮', value: 1 },
                ]}
                width="md"
              />
            </ProForm.Group>
            <ProFormTreeSelect
              name="parentId"
              label="上级菜单"
              rules={[{ required: true, message: '请选择上级菜单' }]}
              width="xl"
              request={async () => {
                const menus = await getAllMenus();
                return [{ title: '根菜单', value: 0, key: 0 }, ...formatTreeSelectData(menus)];
              }}
            />
            <ProForm.Group>
              <ProFormText
                name="path"
                label="路由路径"
                placeholder="如: /system/user"
                width="md"
              />
              <ProFormText
                name="component"
                label="组件路径"
                placeholder="如: system/user/index"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="icon"
                label="图标"
                width="md"
              />
              <ProFormText
                name="permission"
                label="权限标识"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDigit
                name="sort"
                label="排序号"
                width="md"
                fieldProps={{
                  precision: 0,
                  min: 0,
                }}
              />
              <ProFormSwitch
                name="status"
                label="状态"
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </ProForm.Group>
            <ProFormText
              name="id"
              hidden
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该菜单吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" style={{ padding: 0 }}>
              <DeleteOutlined style={{ color: '#ff4d4f' }} />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<Menu>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params = {}, sort, filter) => {
          try {
            const result = await getAllMenus();
            const treeData = convertToTreeData(result);
            // 如果还没有设置展开的键,设置根节点为展开状态
            if (expandedKeys.length === 0) {
              const rootMenus = result.filter(menu => menu.parentId === 0);
              setExpandedKeys(rootMenus.map(menu => menu.id));
            }
            return {
              data: treeData,
              success: true,
            };
          } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.response?.data?.message || apiError.message || '获取菜单列表失败');
            return {
              data: [],
              success: false,
            };
          }
        }}
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'menu-management-table',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        toolbar={{
          actions: [
            <ModalForm<Menu>
              key="add"
              title="添加菜单"
              trigger={
                <Button key="button" type="primary">
                  <PlusOutlined /> 添加菜单
                </Button>
              }
              initialValues={{
                parentId: 0,
                type: 0,
                sort: 0,
                status: true,
              }}
              onFinish={handleSaveMenu}
              modalProps={{
                destroyOnClose: true,
                onCancel: () => {
                  setCurrentMenu(null);
                },
              }}
              width={700}
            >
              <ProForm.Group>
                <ProFormText
                  name="name"
                  label="菜单名称"
                  rules={[{ required: true, message: '请输入菜单名称' }]}
                  width="md"
                />
                <ProFormSelect
                  name="type"
                  label="菜单类型"
                  rules={[{ required: true, message: '请选择菜单类型' }]}
                  options={[
                    { label: '菜单', value: 0 },
                    { label: '按钮', value: 1 },
                  ]}
                  width="md"
                />
              </ProForm.Group>
              <ProFormTreeSelect
                name="parentId"
                label="上级菜单"
                rules={[{ required: true, message: '请选择上级菜单' }]}
                width="xl"
                request={async () => {
                  const menus = await getAllMenus();
                  return [{ title: '根菜单', value: 0, key: 0 }, ...formatTreeSelectData(menus)];
                }}
              />
              <ProForm.Group>
                <ProFormText
                  name="path"
                  label="路由路径"
                  placeholder="如: /system/user"
                  width="md"
                />
                <ProFormText
                  name="component"
                  label="组件路径"
                  placeholder="如: system/user/index"
                  width="md"
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormText
                  name="icon"
                  label="图标"
                  width="md"
                />
                <ProFormText
                  name="permission"
                  label="权限标识"
                  placeholder="如: system:menu:list"
                  width="md"
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormDigit
                  name="sort"
                  label="排序"
                  rules={[{ required: true, message: '请输入排序值' }]}
                  min={0}
                  width="md"
                />
                <ProFormSwitch
                  name="status"
                  label="状态"
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </ProForm.Group>
            </ModalForm>,
          ],
          settings: []
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={false}
        dateFormatter="string"
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
          expandIcon: ({ expanded, onExpand, record }) => {
            if (record.children && record.children.length > 0) {
              return expanded ? (
                <CaretDownOutlined onClick={(e: React.MouseEvent<HTMLElement>) => onExpand(record, e)} />
              ) : (
                <CaretRightOutlined onClick={(e: React.MouseEvent<HTMLElement>) => onExpand(record, e)} />
              );
            }
            return null;
          },
        }}
        childrenColumnName="children"
        indentSize={24}
      />
    </>
  );
};

export default MenuManagement;
