import React, { useRef } from 'react';
import {
  Button,
  Space,
  message,
  Tree,
  Modal,
  Popconfirm,
  Tooltip,
  Switch,
  Input,
} from 'antd';
import type { TreeProps } from 'antd/es/tree';
import type { DataNode } from 'antd/es/tree';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable, 
  ModalForm, 
  ProForm, 
  ProFormText, 
  ProFormTextArea 
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { Role, getRolePage, createRole, updateRole, deleteRole, getRoleMenuIds, assignMenusToRole, updateRoleStatus } from '../../../services/role';
import { Menu, getAllMenus } from '../../../services/menu';
import { ApiError } from '../../../services/api';

interface TreeMenu extends DataNode {
  key: number;
  title: string;
  children?: TreeMenu[];
}

const RoleManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [menuModalVisible, setMenuModalVisible] = React.useState<boolean>(false);
  const [currentRole, setCurrentRole] = React.useState<Role | null>(null);
  const [menus, setMenus] = React.useState<TreeMenu[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = React.useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');

  // 将菜单列表转换为树形结构
  const formatMenuTree = (menus: Menu[]): Menu[] => {
    if (!Array.isArray(menus) || menus.length === 0) {
      return [];
    }

    const menuMap = new Map<number, Menu>();
    const result: Menu[] = [];

    // 先建立映射关系
    menus.forEach(menu => {
      if (menu && typeof menu === 'object') {
        const menuCopy = { ...menu, children: [] };
        menuMap.set(menu.id, menuCopy);
      }
    });

    // 构建树形结构
    menus.forEach(menu => {
      if (menu && typeof menu === 'object') {
        const currentMenu = menuMap.get(menu.id);
        if (currentMenu) {
          if (menu.parentId === 0) {
            // 根节点
            result.push(currentMenu);
          } else {
            // 子节点，添加到父节点的children中
            const parentMenu = menuMap.get(menu.parentId);
            if (parentMenu && Array.isArray(parentMenu.children)) {
              parentMenu.children.push(currentMenu);
            }
          }
        }
      }
    });

    return result;
  };

  // 保存角色
  const handleSaveRole = async (values: any) => {
    try {
      if (values.id) {
        await updateRole(values);
        message.success('角色更新成功');
      } else {
        await createRole(values);
        message.success('角色创建成功');
      }
      actionRef.current?.reload();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存角色失败');
      return false;
    }
  };

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('角色删除成功');
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除角色失败');
    }
  };

  // 将菜单数据转换为 Tree 节点格式
  const formatTreeNode = (menu: Menu): TreeMenu => {
    return {
      key: menu.id,
      title: menu.name,
      children: menu.children?.map(child => formatTreeNode(child)),
    };
  };

  // 处理菜单设置
  const handleMenuSetting = async (record: Role) => {
    setCurrentRole(record);
    try {
      const [menuList, roleMenuIds] = await Promise.all([
        getAllMenus(),
        getRoleMenuIds(record.id),
      ]);
      
      // 将菜单列表转换为树形结构
      const treeMenus = formatMenuTree(menuList);
      
      // 转换为 antd Tree 组件需要的数据格式
      const formattedTreeData = treeMenus.map(menu => formatTreeNode(menu));
      
      setMenus(formattedTreeData);
      setCheckedMenuIds(roleMenuIds);
      setExpandedKeys(roleMenuIds); // 设置展开的节点
      setMenuModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取菜单数据失败');
    }
  };

  // 处理菜单权限保存
  const handleMenuModalOk = async () => {
    if (!currentRole) return;
    try {
      await assignMenusToRole(currentRole.id, checkedMenuIds.map(key => Number(key)));
      message.success('菜单权限设置成功');
      setMenuModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '菜单权限设置失败');
    }
  };

  const columns: ProColumns<Role>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
      sorter: true,
      copyable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          onChange={async (checked) => {
            try {
              await updateRoleStatus(record.id, checked ? 1 : 0);
              message.success('角色状态更新成功');
              actionRef.current?.reload();
            } catch (error) {
              const apiError = error as ApiError;
              message.error(apiError.response?.data?.message || apiError.message || '角色状态更新失败');
            }
          }}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<Role>
            key="edit"
            title="编辑角色"
            trigger={
              <Button type="link" style={{ padding: 0 }}>
                <EditOutlined />
              </Button>
            }
            initialValues={record}
            onFinish={handleSaveRole}
            modalProps={{
              destroyOnClose: true,
            }}
            width={600}
          >
            <ProFormText
              name="name"
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            />
            <ProFormTextArea
              name="description"
              label="角色描述"
              fieldProps={{
                rows: 4,
              }}
            />
            <ProFormText
              name="id"
              hidden
            />
          </ModalForm>
          <Button 
            type="link" 
            style={{ padding: 0 }} 
            onClick={() => handleMenuSetting(record)}
          >
            <MenuOutlined />
          </Button>
          <Popconfirm
            title="确定要删除该角色吗？"
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
      <ProTable<Role>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        bordered
        defaultSize="small"
        request={async (params = {}, sort, filter) => {
          const { current = 1, ...restParams } = params;
          const sortField = Object.keys(sort || {})[0];
          const sortOrder = sortField ? sort[sortField] : undefined;

          try {
            const result = await getRolePage({
              pageNum: current,
              pageSize: params.pageSize || 10,
              sortField,
              sortOrder: sortOrder === 'descend' ? 'desc' : sortOrder === 'ascend' ? 'asc' : undefined,
              keyword: searchKeyword,
            });
            return {
              data: result.list,
              success: true,
              total: result.total,
            };
          } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.response?.data?.message || apiError.message || '获取角色列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'role-management-table',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        headerTitle={
          <Space>
            <Input.Search
              placeholder="请输入关键字搜索"
              onSearch={(value) => {
                setSearchKeyword(value);
                actionRef.current?.reloadAndRest?.();
              }}
              style={{ width: 300 }}
              allowClear
              onReset={() => {
                setSearchKeyword('');
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
        toolbar={{
          actions: [
            <ModalForm<Role>
              key="add"
              title="添加角色"
              trigger={
                <Button key="button" type="primary">
                  <PlusOutlined /> 添加角色
                </Button>
              }
              onFinish={handleSaveRole}
              modalProps={{
                destroyOnClose: true,
              }}
              width={600}
            >
              <ProFormText
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              />
              <ProFormTextArea
                name="description"
                label="角色描述"
                fieldProps={{
                  rows: 4,
                }}
              />
            </ModalForm>,
          ],
        }}
        options={{
          density: false,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
        }}
        dateFormatter="string"
      />

      {/* 菜单权限设置对话框 */}
      <Modal
        title="设置菜单权限"
        open={menuModalVisible}
        onOk={handleMenuModalOk}
        onCancel={() => setMenuModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Tree
          checkable
          checkedKeys={checkedMenuIds}
          onCheck={(checked) => setCheckedMenuIds(checked as React.Key[])}
          treeData={menus}
          expandedKeys={expandedKeys}
          onExpand={(expanded) => setExpandedKeys(expanded)}
        />
      </Modal>
    </>
  );
};

export default RoleManagement; 