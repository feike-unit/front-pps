import React, { useRef, useState } from 'react';
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Radio,
  Tree,
  Tooltip,
  Tag,
} from 'antd';
import type { TreeProps } from 'antd/es/tree';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined, TeamOutlined } from '@ant-design/icons';
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
  removeUserFromDepartment,
} from '../../../services/user';
import type { Department } from '../../../services/department';
import { getAllDepartments, assignUsersToDepartment } from '../../../services/department';
import { Role, getRoles } from '../../../services/role';
import type { ApiError } from '../../../types/api';

// 用户所属部门组件
const UserDepartments: React.FC<{ userId: number; refreshKey: number }> = ({ userId, refreshKey }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [popconfirmVisible, setPopconfirmVisible] = useState<number | null>(null);

  React.useEffect(() => {
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
  }, [userId, refreshKey]);

  const handleRemoveDepartment = async (departmentId: number) => {
    try {
      await removeUserFromDepartment(userId, departmentId);
      message.success('移除部门关系成功');
      const result = await getUserDepartments(userId);
      setDepartments(result);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '移除部门关系失败');
    } finally {
      setPopconfirmVisible(null);
    }
  };

  if (loading) {
    return <span>加载中...</span>;
  }

  return (
    <Space wrap>
      {departments.map(dept => (
        <Popconfirm
          key={dept.id}
          title="确定要移除该部门关系吗？"
          open={popconfirmVisible === dept.id}
          onConfirm={() => handleRemoveDepartment(dept.id)}
          onCancel={() => setPopconfirmVisible(null)}
          okText="确定"
          cancelText="取消"
        >
          <Tag 
            closable 
            onClose={(e) => {
              e.preventDefault();
              setPopconfirmVisible(dept.id);
            }}
          >
            {dept.name}
          </Tag>
        </Popconfirm>
      ))}
    </Space>
  );
};

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加用户');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState<boolean>(false);
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [departmentStatus, setDepartmentStatus] = useState<'all' | 'in' | 'out'>('all');
  const [departmentModalVisible, setDepartmentModalVisible] = useState<boolean>(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [currentAssignUserId, setCurrentAssignUserId] = useState<number | null>(null);
  const [departmentDisplayKey, setDepartmentDisplayKey] = useState<number>(0);

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  // 将平铺结构转换为树形结构
  const convertToTreeData = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const result: Department[] = [];

    departments.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] });
    });

    departments.forEach(dept => {
      const node = map.get(dept.id)!;
      if (dept.parentId === 0) {
        result.push(node);
      } else {
        const parent = map.get(dept.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return result;
  };

  // 格式化部门树数据
  const formatDepartmentTreeData = (data: Department[]): any[] => {
    return data.map(item => ({
      title: item.name,
      key: item.id,
      children: item.children && item.children.length > 0 ? formatDepartmentTreeData(item.children) : undefined,
    }));
  };

  // 获取部门树数据
  const fetchDepartments = async () => {
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        const treeData = formatDepartmentTreeData(convertToTreeData(result));
        setDepartments(treeData);
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    }
  };

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
      actionRef.current?.reload();
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
      actionRef.current?.reload();
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
        actionRef.current?.reload();
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
      actionRef.current?.reload();
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
      actionRef.current?.reload();
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
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '批量分配角色失败');
    }
  };

  // 显示加入部门对话框（支持单个和批量）
  const showAssignDepartmentModal = async (userId?: number) => {
    if (userId) {
      setCurrentAssignUserId(userId);
    } else {
      if (selectedRowKeys.length === 0) {
        message.warning('请先选择用户');
        return;
      }
      setCurrentAssignUserId(null);
    }
    await fetchDepartments();
    setDepartmentModalVisible(true);
  };

  // 处理批量加入部门
  const handleBatchAssignDepartment = async () => {
    if (!selectedDepartmentId) {
      message.error('请选择部门');
      return;
    }

    try {
      const userIds = currentAssignUserId 
        ? [currentAssignUserId] 
        : selectedRowKeys.map(key => Number(key));

      await assignUsersToDepartment(selectedDepartmentId, userIds);
      message.success('用户加入部门成功');
      setDepartmentModalVisible(false);
      setSelectedDepartmentId(null);
      setCurrentAssignUserId(null);
      if (!currentAssignUserId) {
        setSelectedRowKeys([]);
      }
      setDepartmentDisplayKey(prev => prev + 1);
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '用户加入部门失败');
    }
  };

  // 处理部门选择
  const handleDepartmentSelect: TreeProps['onSelect'] = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      setSelectedDepartmentId(Number(selectedKeys[0]));
    }
  };

  // ProTable 列定义
  const columns: ProColumns<User>[] = [
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
      search: false,
      render: (_, record) => departmentStatus !== 'out' ? (
        <UserDepartments 
          userId={record.id} 
          refreshKey={departmentDisplayKey}
        />
      ) : null,
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
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      search: false,
      render: (_, record) => record.roles?.join(', ') || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          onChange={(checked) => handleStatusChange(checked, record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 160,
      render: (_, record) => [
        <Tooltip key="edit" title="编辑用户">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleAddOrEdit(record)}
          />
        </Tooltip>,
        <Tooltip key="password" title="重置密码">
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => showPasswordModal(record)}
          />
        </Tooltip>,
        <Tooltip key="role" title="分配角色">
          <Button
            type="link"
            size="small"
            icon={<UserSwitchOutlined />}
            onClick={() => showRoleModal(record)}
          />
        </Tooltip>,
        <Tooltip key="department" title="分配部门">
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => showAssignDepartmentModal(record.id)}
          />
        </Tooltip>,
        <Tooltip key="delete" title="删除用户">
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Tooltip>,
      ],
    },
  ];

  return (
    <>
      <ProTable<User>
        headerTitle="用户管理"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Radio.Group 
            key="departmentStatus" 
            value={departmentStatus} 
            onChange={(e) => {
              setDepartmentStatus(e.target.value);
              actionRef.current?.reload();
            }}
          >
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="in">已加入部门</Radio.Button>
            <Radio.Button value="out">未加入部门</Radio.Button>
          </Radio.Group>,
          <Button
            key="add"
            type="primary"
            onClick={() => handleAddOrEdit()}
            icon={<PlusOutlined />}
          >
            添加用户
          </Button>,
          selectedRowKeys.length > 0 && [
            <Popconfirm
              key="batchDelete"
              title="确定要删除选中的用户吗？"
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>,
            <Button 
              key="batchRole" 
              icon={<UserSwitchOutlined />} 
              onClick={showBatchRoleModal}
            >
              批量分配角色
            </Button>,
            <Button 
              key="batchDepartment" 
              icon={<TeamOutlined />} 
              onClick={() => showAssignDepartmentModal()}
            >
              批量加入部门
            </Button>,
          ],
        ]}
        request={async (params, sort, filter) => {
          const { current = 1, pageSize = 10, ...restParams } = params;
          const sortField = Object.keys(sort || {})[0];
          const sortOrder = sortField ? sort[sortField] : undefined;

          try {
            const result = await getUsers({
              pageNum: current,
              pageSize,
              keyword: restParams.username || restParams.name || restParams.email || restParams.phone,
              sortField,
              sortOrder: sortOrder === 'descend' ? 'desc' : sortOrder === 'ascend' ? 'asc' : undefined,
              departmentStatus,
            });

            return {
              data: result.list,
              success: true,
              total: result.total,
            };
          } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.response?.data?.message || apiError.message || '获取用户列表失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
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
          <Form.Item 
            name="email" 
            label="邮箱" 
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
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
          <Form.Item 
            name="password" 
            label="新密码" 
            rules={[{ required: true, message: '请输入新密码' }]}
          >
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

      {/* 加入部门对话框（支持单个和批量） */}
      <Modal
        title={currentAssignUserId ? '加入部门' : '批量加入部门'}
        open={departmentModalVisible}
        onOk={handleBatchAssignDepartment}
        onCancel={() => {
          setDepartmentModalVisible(false);
          setSelectedDepartmentId(null);
          setCurrentAssignUserId(null);
          if (!currentAssignUserId) {
            setSelectedRowKeys([]);
          }
        }}
        width={400}
      >
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <Tree
            treeData={departments}
            onSelect={handleDepartmentSelect}
            selectedKeys={selectedDepartmentId ? [selectedDepartmentId] : []}
            defaultExpandAll
          />
        </div>
      </Modal>
    </>
  );
};

export default UserManagement;