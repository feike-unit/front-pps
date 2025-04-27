import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { Role, getRoles, createRole, updateRole, deleteRole, getRoleMenuIds, assignMenusToRole } from '../../../services/role';
import { Menu, getAllMenus } from '../../../services/menu';
import { ApiError } from '../../../types/api';

const { TextArea } = Input;

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加角色');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const result = await getRoles();
      if (result && Array.isArray(result)) {
        setRoles(result);
      } else {
        setRoles([]);
        message.warning('获取角色列表数据格式不正确');
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取菜单列表
  const fetchMenus = async () => {
    try {
      const result = await getAllMenus();
      // 将菜单列表转换为树形结构
      if (result && Array.isArray(result)) {
        const treeMenus = formatMenuTree(result);
        setMenus(treeMenus);
      } else {
        setMenus([]);
        message.warning('获取菜单列表数据格式不正确');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取菜单列表失败');
    }
  };

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

  useEffect(() => {
    fetchRoles();
  }, []);

  // 添加或编辑角色
  const handleAddOrEdit = (role?: Role) => {
    if (role) {
      setModalTitle('编辑角色');
      setCurrentRole(role);
      form.setFieldsValue({
        name: role.name,
        description: role.description,
      });
    } else {
      setModalTitle('添加角色');
      setCurrentRole(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 保存角色
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      if (currentRole) {
        await updateRole({ id: currentRole.id, ...values });
        message.success('角色更新成功');
      } else {
        await createRole(values);
        message.success('角色创建成功');
      }
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存角色失败');
    }
  };

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('角色删除成功');
      fetchRoles();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除角色失败');
    }
  };

  // 显示分配菜单对话框
  const showMenuModal = async (role: Role) => {
    setCurrentRole(role);
    setMenuLoading(true);
    try {
      // 如果菜单列表为空，先获取菜单列表
      if (menus.length === 0) {
        await fetchMenus();
      }
      // 获取角色已有的菜单ID列表
      const menuIds = await getRoleMenuIds(role.id);
      setCheckedMenuIds(menuIds);
      // 设置默认展开的一级菜单
      const firstLevelKeys = menus
        .filter(menu => menu.parentId === 0)
        .map(menu => menu.id);
      setExpandedKeys(firstLevelKeys);
      setMenuModalVisible(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取角色菜单失败');
    } finally {
      setMenuLoading(false);
    }
  };

  // 保存角色菜单
  const handleSaveRoleMenus = async () => {
    if (!currentRole) {
      message.error('未选择角色');
      return;
    }
    setMenuLoading(true);
    try {
      await assignMenusToRole(currentRole.id, checkedMenuIds as number[]);
      message.success('菜单分配成功');
      setMenuModalVisible(false);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存角色菜单失败');
    } finally {
      setMenuLoading(false);
    }
  };

  // 将菜单数据转换为Tree组件所需的结构
  const convertToTreeData = (menus: Menu[]): DataNode[] => {
    return menus.map(menu => ({
      key: menu.id,
      title: menu.name,
      children: menu.children && menu.children.length > 0 ? convertToTreeData(menu.children) : undefined,
    }));
  };

  // 树形选择处理
  const handleMenuCheck = (checkedKeys: any, info: any) => {
    setCheckedMenuIds(Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked);
  };

  // 处理展开/收起
  const handleExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Role) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleAddOrEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<MenuOutlined />} onClick={() => showMenuModal(record)}>
            分配菜单
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加角色
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={roles}
        columns={columns}
        rowKey="id"
        pagination={{ showSizeChanger: true }}
      />

      {/* 角色表单弹窗 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
          >
            <TextArea rows={4} placeholder="请输入角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 菜单分配弹窗 */}
      <Modal
        title="分配菜单"
        open={menuModalVisible}
        onOk={handleSaveRoleMenus}
        onCancel={() => setMenuModalVisible(false)}
        confirmLoading={menuLoading}
        width={600}
      >
        <Tree
          checkable
          checkedKeys={checkedMenuIds}
          onCheck={handleMenuCheck}
          treeData={convertToTreeData(menus)}
          disabled={menuLoading}
          expandedKeys={expandedKeys}
          onExpand={handleExpand}
        />
      </Modal>
    </Card>
  );
};

export default RoleManagement; 