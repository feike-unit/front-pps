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
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { User, getUsers, createUser, updateUser, deleteUser, resetPassword } from '../../../services/user';
import { Role, getRoles } from '../../../services/role';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加用户');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState<boolean>(false);
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers({ pageNum: 1, pageSize: 10 });
      if (result && result.list && Array.isArray(result.list)) {
        setUsers(result.list);
      } else {
        setUsers([]);
        message.warning('获取用户列表数据格式不正确');
      }
    } catch (error) {
      setUsers([]);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const result = await getRoles();
      if (result && Array.isArray(result)) {
        setRoles(result);
      } else {
        setRoles([]);
        message.warning('获取角色列表数据格式不正确');
      }
    } catch (error) {
      setRoles([]);
      message.error('获取角色列表失败');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // 添加或编辑用户
  const handleAddOrEdit = (user?: User) => {
    if (user) {
      setModalTitle('编辑用户');
      setCurrentUser(user);
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status === 1,
        roleIds: user.roles?.map(role => roles.find(r => r.name === role)?.id).filter(Boolean),
      });
    } else {
      setModalTitle('添加用户');
      setCurrentUser(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 保存用户
  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      const params = {
        ...values,
        status: values.status ? 1 : 0,
      };

      if (currentUser) {
        await updateUser({ id: currentUser.id, ...params });
        message.success('用户更新成功');
      } else {
        await createUser(params);
        message.success('用户创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 显示重置密码对话框
  const showPasswordModal = (user: User) => {
    setCurrentUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // 重置密码
  const handleResetPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (currentUser) {
        await resetPassword(currentUser.id, values.password);
        message.success('密码重置成功');
        setPasswordModalVisible(false);
      }
    } catch (error) {
      message.error('密码重置失败');
    }
  };

  // 显示分配角色对话框
  const showRoleModal = (user: User) => {
    setCurrentUser(user);
    const userRoleIds = user.roles?.map(role => roles.find(r => r.name === role)?.id).filter(Boolean) as number[];
    setSelectedUserRoles(userRoleIds || []);
    roleForm.setFieldsValue({ roleIds: userRoleIds });
    setRoleModalVisible(true);
  };

  // 保存用户角色
  const handleSaveUserRoles = async () => {
    try {
      const values = await roleForm.validateFields();
      if (currentUser) {
        await updateUser({ id: currentUser.id, roleIds: values.roleIds });
        message.success('角色分配成功');
        setRoleModalVisible(false);
        fetchUsers();
      }
    } catch (error) {
      message.error('角色分配失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (status === 1 ? '启用' : '禁用'),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => roles?.join(', '),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleAddOrEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<KeyOutlined />} onClick={() => showPasswordModal(record)}>
            重置密码
          </Button>
          <Button type="link" icon={<UserSwitchOutlined />} onClick={() => showRoleModal(record)}>
            分配角色
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
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
      title="用户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加用户
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={users} loading={loading} />

      {/* 添加/编辑用户对话框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveUser}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!!currentUser} />
          </Form.Item>
          {!currentUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map(role => ({ label: role.name, value: role.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码对话框 */}
      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onOk={handleResetPassword}
        onCancel={() => setPasswordModalVisible(false)}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配角色对话框 */}
      <Modal
        title="分配角色"
        open={roleModalVisible}
        onOk={handleSaveUserRoles}
        onCancel={() => setRoleModalVisible(false)}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item name="roleIds" label="角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map(role => ({ label: role.name, value: role.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;