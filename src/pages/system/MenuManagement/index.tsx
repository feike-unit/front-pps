import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  TreeSelect,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Menu, getAllMenus, createMenu, updateMenu, deleteMenu } from '../../../services/menu';
import { ApiError } from '../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const MenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加菜单');
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [form] = Form.useForm();

  // 获取菜单列表
  const fetchMenus = async () => {
    setLoading(true);
    try {
      const result = await getAllMenus();
      if (result && Array.isArray(result)) {
        setMenus(result);

        // 构建树形选择数据
        const treeSelectData = formatTreeSelectData([{ id: 0, name: '根菜单', parentId: -1 } as Menu, ...result]);
        setTreeData(treeSelectData);
      } else {
        setMenus([]);
        setTreeData([{ title: '根菜单', value: 0, key: 0 }]);
        message.warning('获取菜单列表数据格式不正确');
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 将菜单列表转换为TreeSelect需要的数据格式
  const formatTreeSelectData = (data: Menu[]): any[] => {
    return data.map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children && item.children.length > 0 ? formatTreeSelectData(item.children) : undefined,
    }));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 添加或编辑菜单
  const handleAddOrEdit = (menu?: Menu) => {
    if (menu) {
      setModalTitle('编辑菜单');
      setCurrentMenu(menu);
      form.setFieldsValue({
        name: menu.name,
        type: menu.type,
        parentId: menu.parentId,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        sort: menu.sort,
        permission: menu.permission,
        urlPattern: menu.urlPattern,
        method: menu.method,
        status: menu.status === 1,
      });
    } else {
      setModalTitle('添加菜单');
      setCurrentMenu(null);
      form.resetFields();
      form.setFieldsValue({ parentId: 0, type: 0, sort: 0, status: true });
    }
    setModalVisible(true);
  };

  // 保存菜单
  const handleSaveMenu = async () => {
    try {
      const values = await form.validateFields();
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
      setModalVisible(false);
      fetchMenus();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存菜单失败');
    }
  };

  // 删除菜单
  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success('菜单删除成功');
      fetchMenus();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除菜单失败');
    }
  };

  // 递归处理菜单数据，用于表格展示
  const processMenuData = (data: Menu[]): Menu[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(menu => menu && menu.parentId === 0)
      .map(menu => {
        const children = getChildren(data, menu.id);
        return {
          ...menu,
          // 只有当有子菜单时才添加 children 属性
          ...(children.length > 0 ? { children } : {})
        };
      });
  };

  // 获取子菜单
  const getChildren = (data: Menu[], parentId: number): Menu[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(menu => menu && menu.parentId === parentId)
      .map(menu => {
        const children = getChildren(data, menu.id);
        return {
          ...menu,
          // 只有当有子菜单时才添加 children 属性
          ...(children.length > 0 ? { children } : {})
        };
      });
  };

  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => (type === 0 ? '菜单' : '按钮'),
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '组件',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
      key: 'permission',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (status === 1 ? '启用' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Menu) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleAddOrEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个菜单吗？"
            description="删除后将无法恢复，且会同时删除其所有子菜单。"
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
      title="菜单管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加菜单
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={processMenuData(menus)}
        loading={loading}
        pagination={false}
        childrenColumnName="children"
        indentSize={24}
      />

      {/* 添加/编辑菜单对话框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveMenu}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="type" label="菜单类型" rules={[{ required: true, message: '请选择菜单类型' }]}>
            <Select>
              <Option value={0}>菜单</Option>
              <Option value={1}>按钮</Option>
            </Select>
          </Form.Item>
          <Form.Item name="parentId" label="上级菜单" rules={[{ required: true, message: '请选择上级菜单' }]}>
            <TreeSelect
              treeData={treeData}
              placeholder="请选择上级菜单"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 0 ? (
                <>
                  <Form.Item name="path" label="路由路径">
                    <Input placeholder="如: /system/user" />
                  </Form.Item>
                  <Form.Item name="component" label="组件路径">
                    <Input placeholder="如: system/user/index" />
                  </Form.Item>
                  <Form.Item name="icon" label="图标">
                    <Input />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name="urlPattern" label="URL匹配模式">
                    <Input placeholder="如: /api/system/users/**" />
                  </Form.Item>
                  <Form.Item name="method" label="HTTP方法">
                    <Select>
                      <Option value="GET">GET</Option>
                      <Option value="POST">POST</Option>
                      <Option value="PUT">PUT</Option>
                      <Option value="DELETE">DELETE</Option>
                    </Select>
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>
          <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序值' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="permission" label="权限标识">
            <Input placeholder="如: system:user:list" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default MenuManagement;
