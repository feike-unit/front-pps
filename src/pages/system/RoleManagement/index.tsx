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
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { Role, getRoles, createRole, updateRole, deleteRole, getRoleMenuIds, assignMenusToRole } from '../../../services/role';
import { Menu, getAllMenus } from '../../../services/menu';

const { TextArea } = Input;

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加角色');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const result = await getRoles();
      setRoles(result);
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取菜单列表
  const fetchMenus = async () => {
    try {
      const result = await getAllMenus();
      // 将菜单列表转换为树形结构
      const treeMenus = formatMenuTree(result);
      setMenus(treeMenus);
    } catch (error) {
      message.error('获取菜单列表失败');
    }
  };

  // 将菜单列表转换为树形结构
  const formatMenuTree = (menus: Menu[]): Menu[] => {
    const menuMap = new Map<number, Menu>();
    const result: Menu[] = [];

    // 先建立映射关系
    menus.forEach(menu => {
      menu.children = [];
      menuMap.set(menu.id, { ...menu });
    });

    // 构建树形结构
    menus.forEach(menu => {
      const currentMenu = menuMap.get(menu.id);
      if (menu.parentId === 0) {
        // 根节点
        result.push(currentMenu as Menu);
      } else {
        // 子节点，添加到父节点的children中
        const parentMenu = menuMap.get(menu.parentId);
        if (parentMenu) {
          parentMenu.children?.push(currentMenu as Menu);
        }
      }
    });

    return result;
  };

  useEffect(() => {
    fetchRoles();
    fetchMenus();
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
      message.error('操作失败');
    }
  };

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('角色删除成功');
      fetchRoles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 显示分配菜单对话框
  const showMenuModal = async (role: Role) => {
    setCurrentRole(role);
    try {
      // 获取角色已有的菜单ID列表
      const menuIds = await getRoleMenuIds(role.id);
      setCheckedMenuIds(menuIds);
      setMenuModalVisible(true);
    } catch (error) {
      message.error('获取角色菜单失败');
    }
  };

  // 保存角色菜单
  const handleSaveRoleMenus = async () => {
    try {
      if (currentRole) {
        await assignMenusToRole(currentRole.id, checkedMenuIds as number[]);
        message.success('菜单分配成功');
        setMenuModalVisible(false);
      }
    } catch (error) {
      message.error('菜单分配失败');
    }
  };

  // 树形选择处理
  const handleMenuCheck = (checkedKeys: React.Key[]) => {
    setCheckedMenuIds(checkedKeys);
  };

  // 将菜单数据转换为Tree组件所需的结构
  const convertToTreeData = (menus: Menu[]) => {
    return menus.map(menu => ({
      key: menu.id,
      title: menu.name,
      children: menu.children && menu.children.length > 0 ? convertToTreeData(menu.children) : undefined,
    }));
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
    <Card
      title="角色管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加角色
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={roles} loading={loading} />

      {/* 添加/编辑角色对话框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配菜单对话框 */}
      <Modal
        title="分配菜单"
        open={menuModalVisible}
        onOk={handleSaveRoleMenus}
        onCancel={() => setMenuModalVisible(false)}
        width={600}
      >
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedMenuIds}
          onCheck={handleMenuCheck}
          treeData={convertToTreeData(menus)}
        />
      </Modal>
    </Card>
  );
};

export default RoleManagement; 