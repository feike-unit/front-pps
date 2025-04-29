import React, { useState, useEffect, useCallback } from 'react';
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
  TablePaginationConfig,
  Radio,
  RadioChangeEvent,
  Tag,
} from 'antd';
import type { TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined, SearchOutlined } from '@ant-design/icons';
import { 
  User, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  deleteUsers,
  resetPassword, 
  updateUserRoles,
  updateUserStatus,
  assignRolesBatch,
  getUserDepartments,
} from '../../../services/user';
import type { Department } from '../../../services/department';
import { Role, getRoles } from '../../../services/role';
import type { ApiError } from '../../../types/api';

// 用户所属部门组件
const UserDepartments: React.FC<{ userId: number }> = ({ userId }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const result = await getUserDepartments(userId);
        setDepartments(result);
      } catch (error) {
        const apiError = error as ApiError;
        message.error(apiError.response?.data?.message || apiError.message || '获取部门信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, [userId]);

  if (loading) {
    return <span>加载中...</span>;
  }

  return (
    <Space wrap>
      {departments.map(dept => (
        <Tag key={dept.id}>{dept.name}</Tag>
      ))}
    </Space>
  );
};

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [lastSelectedKey, setLastSelectedKey] = useState<React.Key | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total: number) => `共 ${total} 条记录`,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [keyword, setKeyword] = useState<string>('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [departmentStatus, setDepartmentStatus] = useState<'all' | 'in' | 'out'>('all');

  // 获取用户列表
  const fetchUsers = async (
    page = pagination.current || 1, 
    pageSize = pagination.pageSize || 10, 
    searchKeyword = keyword,
    sortField?: string,
    sortOrder?: string,
    status: 'all' | 'in' | 'out' = departmentStatus,
  ) => {
    setLoading(true);
    try {
      console.log('departmentStatus:', departmentStatus);
      const result = await getUsers({ 
        pageNum: page, 
        pageSize, 
        keyword: searchKeyword,
        sortField,
        sortOrder,
        departmentStatus: status,
      });
      setUsers(result.list);
      setPagination({
        ...pagination,
        current: result.pageNum,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用useCallback包装延迟搜索函数，避免重复创建
  const delayedSearch = useCallback((value: string) => {
    // 如果已经有定时器在运行，先清除它
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      fetchUsers(1, pagination.pageSize, value);
    }, 200);

    setSearchTimer(timer);
  }, [pagination.pageSize, searchTimer]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理表格变化
  const handleTableChange: TableProps<User>['onChange'] = (
    newPagination: TablePaginationConfig,
    _filters,
    sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    const { current = 1, pageSize = 10 } = newPagination;
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortField = singleSorter.field as string;
    const sortOrder = singleSorter.order ? 
      (singleSorter.order === 'descend' ? 'desc' : 'asc') : 
      undefined;

    fetchUsers(current, pageSize, keyword, sortField, sortOrder);
  };

  // 处理搜索
  const handleSearch = () => {
    // 无论搜索关键字是否为空都触发查询
    fetchUsers(1, pagination.pageSize, keyword);
  };

  // 处理搜索框回车
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理搜索框值变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    delayedSearch(value);
  };

  // 在组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // 添加或编辑用户
  const handleAddOrEdit = async (user?: User) => {
    if (user) {
      setModalTitle('编辑用户');
      setCurrentUser(user);
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status === 1,
      });
    } else {
      setModalTitle('添加用户');
      setCurrentUser(null);
      form.resetFields();
      form.setFieldsValue({ status: true });
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
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存用户失败');
    }
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除用户失败');
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
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '重置密码失败');
    }
  };

  // 显示分配角色对话框
  const showRoleModal = async (user: User) => {
    try {
      const result = await getRoles();
      if (result && Array.isArray(result)) {
        setRoles(result);
        setCurrentUser(user);
        const userRoleIds = user.roles?.map(role => result.find(r => r.name === role)?.id).filter(Boolean) as number[];
        setSelectedUserRoles(userRoleIds || []);
        roleForm.setFieldsValue({ roleIds: userRoleIds });
        setRoleModalVisible(true);
      } else {
        message.warning('获取角色列表数据格式不正确');
      }
    } catch (error) {
      message.error('获取角色列表失败');
    }
  };

  // 保存用户角色
  const handleSaveUserRoles = async () => {
    try {
      const values = await roleForm.validateFields();
      if (currentUser) {
        await updateUserRoles(currentUser.id, values.roleIds);
        message.success('角色分配成功');
        setRoleModalVisible(false);
        fetchUsers();
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存用户角色失败');
    }
  };

  // 处理用户状态变更
  const handleStatusChange = async (checked: boolean, user: User) => {
    try {
      await updateUserStatus(user.id, checked ? 1 : 0);
      message.success('用户状态更新成功');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '用户状态更新失败');
    }
  };

  // 批量删除用户
  const handleBatchDelete = async () => {
    try {
      await deleteUsers(selectedRowKeys.map(key => Number(key)));
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchUsers();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '批量删除失败');
    }
  };

  // 显示批量分配角色对话框
  const showBatchRoleModal = async () => {
    try {
      const result = await getRoles();
      if (result && Array.isArray(result)) {
        setRoles(result);
        roleForm.resetFields();
        setRoleModalVisible(true);
      } else {
        message.warning('获取角色列表数据格式不正确');
      }
    } catch (error) {
      message.error('获取角色列表失败');
    }
  };

  // 保存批量分配的角色
  const handleSaveBatchRoles = async () => {
    try {
      const values = await roleForm.validateFields();
      await assignRolesBatch(selectedRowKeys.map(key => Number(key)), values.roleIds);
      message.success('批量分配角色成功');
      setRoleModalVisible(false);
      setSelectedRowKeys([]);
      fetchUsers();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '批量分配角色失败');
    }
  };

  // 处理部门状态变化
  const handleDepartmentStatusChange = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setDepartmentStatus(value);
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: '所属部门',
      key: 'departments',
      render: (_: unknown, record: User) => departmentStatus !== 'out' ? <UserDepartments userId={record.id} /> : null,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      render: (status: number, record: User) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(checked, record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => roles?.join(', ') || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleAddOrEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={() => showPasswordModal(record)}
          >
            重置密码
          </Button>
          <Button
            type="text"
            icon={<UserSwitchOutlined />}
            onClick={() => showRoleModal(record)}
          >
            分配角色
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
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
        <Space>
          <Input
            placeholder="请输入用户名或姓名搜索"
            value={keyword}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Radio.Group value={departmentStatus} onChange={handleDepartmentStatusChange}>
            <Radio.Button value="all" onClick={() => fetchUsers(1, pagination.pageSize, keyword, undefined, undefined, 'all')}>全部</Radio.Button>
            <Radio.Button value="in" onClick={() => fetchUsers(1, pagination.pageSize, keyword, undefined, undefined, 'in')}>已加入部门</Radio.Button>
            <Radio.Button value="out" onClick={() => fetchUsers(1, pagination.pageSize, keyword, undefined, undefined, 'out')}>未加入部门</Radio.Button>
          </Radio.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
            添加用户
          </Button>
          {selectedRowKeys.length > 0 && (
            <>
              <Popconfirm
                title="确定要删除选中的用户吗？"
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>批量删除</Button>
              </Popconfirm>
              <Button icon={<UserSwitchOutlined />} onClick={showBatchRoleModal}>批量分配角色</Button>
            </>
          )}
        </Space>
      }
    >
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={users} 
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys, selectedRows) => {
            setSelectedRowKeys(selectedKeys);
          },
          onSelect: (record, selected) => {
            setLastSelectedKey(selected ? record.id : null);
          },
        }}
      />

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
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
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
        title={currentUser ? "分配角色" : "批量分配角色"}
        open={roleModalVisible}
        onOk={currentUser ? handleSaveUserRoles : handleSaveBatchRoles}
        onCancel={() => {
          setRoleModalVisible(false);
          setCurrentUser(null);
        }}
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map(role => ({ 
                label: `${role.name}${role.description ? ` - ${role.description}` : ''}`, 
                value: role.id 
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;