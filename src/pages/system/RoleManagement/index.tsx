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
  Tooltip,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined, EditOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { Role, getRolePage, createRole, updateRole, deleteRole, getRoleMenuIds, assignMenusToRole } from '../../../services/role';
import { Menu, getAllMenus } from '../../../services/menu';
import { ApiError } from '../../../services/api';

const { TextArea } = Input;

interface TreeMenu extends DataNode {
  key: number;
  title: string;
  children?: TreeMenu[];
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<TreeMenu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [menuModalVisible, setMenuModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加角色');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('');

  useEffect(() => {
    fetchRoles();
  }, [pagination.current, pagination.pageSize, sortField, sortOrder]);

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const result = await getRolePage({
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        sortField,
        sortOrder,
      });
      if (result) {
        setRoles(result.list);
        setPagination({
          ...pagination,
          total: result.total,
        });
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
        setMenus(treeMenus.map(menu => formatTreeNode(menu)));
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

  // 处理表格变化
  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'descend' ? 'desc' : 'asc');
    } else {
      setSortField('');
      setSortOrder('');
    }
  };

  // 添加角色
  const handleAdd = () => {
    setModalTitle('添加角色');
    setCurrentRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑角色
  const handleEdit = (record: Role) => {
    setModalTitle('编辑角色');
    setCurrentRole(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('删除成功');
      fetchRoles();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除失败');
    }
  };

  // 处理菜单设置
  const handleMenuSetting = async (record: Role) => {
    setCurrentRole(record);
    setMenuLoading(true);
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
    } finally {
      setMenuLoading(false);
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

  // 处理表单提交
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (currentRole) {
        await updateRole({ ...values, id: currentRole.id });
        message.success('更新成功');
      } else {
        await createRole(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '操作失败');
    }
  };

  // 处理菜单权限保存
  const handleMenuModalOk = async () => {
    if (!currentRole) return;
    try {
      await assignMenusToRole(currentRole.id, checkedMenuIds.map(key => Number(key)));
      message.success('菜单权限设置成功');
      setMenuModalVisible(false);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '菜单权限设置失败');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleMenuModalCancel = () => {
    setMenuModalVisible(false);
    setCheckedMenuIds([]);
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Role) => (
        <Space size={0}>
          <Tooltip title="编辑角色">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="菜单权限">
            <Button
              type="link"
              size="small"
              icon={<MenuOutlined />}
              onClick={() => handleMenuSetting(record)}
            />
          </Tooltip>
          <Tooltip title="删除角色">
            <Popconfirm
              title="确定要删除该角色吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button 
                type="link" 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="角色管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加角色
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        destroyOnClose
      >
        <Form
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          initialValues={currentRole || {}}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="设置菜单权限"
        open={menuModalVisible}
        onOk={handleMenuModalOk}
        onCancel={handleMenuModalCancel}
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
    </Card>
  );
};

export default RoleManagement; 