import React, { useRef } from 'react';
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
  Tag,
  Table,
} from 'antd';
import type { TreeProps } from 'antd/es/tree';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable, 
  TableDropdown, 
  LightFilter, 
  ModalForm,
  ProForm,
  ProFormText,
  ProFormSwitch,
  ProFormSelect,
  ProFormDependency,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined, TeamOutlined, EllipsisOutlined } from '@ant-design/icons';
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
import type { ApiError } from '../../../services/api';

// 用户所属部门组件
const UserDepartments: React.FC<{ userId: number; refreshKey: number }> = ({ userId, refreshKey }) => {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [popconfirmVisible, setPopconfirmVisible] = React.useState<number | null>(null);

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
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [modalTitle, setModalTitle] = React.useState<string>('添加用户');
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState<boolean>(false);
  const [roleModalVisible, setRoleModalVisible] = React.useState<boolean>(false);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [departmentStatus, setDepartmentStatus] = React.useState<'all' | 'in' | 'out'>('all');
  const [departmentModalVisible, setDepartmentModalVisible] = React.useState<boolean>(false);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null);
  const [currentAssignUserId, setCurrentAssignUserId] = React.useState<number | null>(null);
  const [departmentDisplayKey, setDepartmentDisplayKey] = React.useState<number>(0);
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');
  const [resetPasswordVisible, setResetPasswordVisible] = React.useState<boolean>(false);

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
  const handleSaveUser = async (values: any) => {
    try {
      const params = {
        ...values,
        status: values.status ? 1 : 0,
      };

      if (values.id) {
        await updateUser({ id: values.id, ...params });
        message.success('用户更新成功');
      } else {
        await createUser(params);
        message.success('用户创建成功');
      }
      actionRef.current?.reload();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存用户失败');
      return false;
    }
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除该用户吗？',
      async onOk() {
        try {
          await deleteUser(id);
          message.success('用户删除成功');
          actionRef.current?.reload();
        } catch (error) {
          const apiError = error as ApiError;
          message.error(apiError.response?.data?.message || apiError.message || '删除用户失败');
        }
      },
    });
  };

  // 显示重置密码对话框
  const showPasswordModal = (user: User) => {
    setCurrentUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // 重置密码
  const handleResetPassword = async (values: any) => {
    try {
      if (currentUser) {
        await resetPassword(currentUser.id, values.password);
        message.success('密码重置成功');
        setPasswordModalVisible(false);
        return true;
      }
      return false;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '重置密码失败');
      return false;
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
  const handleSaveUserRoles = async (values: any) => {
    try {
      if (currentUser) {
        await updateUserRoles(currentUser.id, values.roleIds);
        message.success('角色分配成功');
        setRoleModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      return false;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存用户角色失败');
      return false;
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
  const handleSaveBatchRoles = async (values: any) => {
    try {
      await assignRolesBatch(selectedRowKeys.map(key => Number(key)), values.roleIds);
      message.success('批量分配角色成功');
      setRoleModalVisible(false);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '批量分配角色失败');
      return false;
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
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
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
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <Space wrap>
          {record.roles?.map(role => (
            <Tag key={role}>{role}</Tag>
          ))}
        </Space>
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
      width: 120,
      render: (_, record) => [
        <ModalForm<User>
          key="edit"
          title="编辑用户"
          trigger={<a>编辑</a>}
          initialValues={{
            ...record,
            status: record.status === 1,
          }}
          onFinish={handleSaveUser}
          modalProps={{
            destroyOnClose: true,
          }}
          width={600}
        >
          <ProForm.Group>
            <ProFormText
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              disabled
              width="md"
            />
            <ProFormText
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '邮箱格式不正确' }]}
              width="md"
            />
            <ProFormText
              name="phone"
              label="手机号"
              width="md"
            />
          </ProForm.Group>
          <ProFormSwitch
            name="status"
            label="状态"
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
          <ProFormText
            name="id"
            hidden
          />
        </ModalForm>,
        <TableDropdown
          key="actionGroup"
          onSelect={async (key) => {
            if (key === 'assign_department') {
              await showAssignDepartmentModal(record.id);
            } else if (key === 'delete') {
              handleDelete(record.id);
            }
          }}
          menus={[
            {
              key: 'reset_password',
              name: '重置密码',
              onClick: () => {
                setCurrentUser(record);
                setResetPasswordVisible(true);
              },
            },
            {
              key: 'assign_role',
              name: '分配角色',
              onClick: async () => {
                try {
                  const result = await getRoles();
                  if (result && Array.isArray(result)) {
                    setRoles(result);
                    setCurrentUser(record);
                  } else {
                    message.warning('获取角色列表数据格式不正确');
                  }
                } catch (error) {
                  message.error('获取角色列表失败');
                }
              },
            },
            { key: 'assign_department', name: '分配部门' },
            { 
              key: 'delete', 
              name: '删除',
              danger: true,
            },
          ]}
        />,
      ],
    },
  ];

  return (
    <>
      <ProTable<User>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params = {}, sort, filter) => {
          const { current = 1, pageSize = 10, ...restParams } = params;
          const sortField = Object.keys(sort || {})[0];
          const sortOrder = sortField ? sort[sortField] : undefined;

          try {
            const result = await getUsers({
              pageNum: current,
              pageSize,
              keyword: searchKeyword,
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
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'user-management-table',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          selectedRowKeys,
          onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys);
          },
        }}
        tableAlertRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
          <Space size={24}>
            <span>
              已选 {selectedRowKeys.length} 项
              <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                取消选择
              </a>
            </span>
          </Space>
        )}
        tableAlertOptionRender={() => {
          return (
            <Space size={16}>
              <Popconfirm
                title="确定要删除选中的用户吗？"
                onConfirm={handleBatchDelete}
              >
                <a>批量删除</a>
              </Popconfirm>
              <ModalForm
                title="批量分配角色"
                trigger={<a>批量分配角色</a>}
                onFinish={handleSaveBatchRoles}
                modalProps={{
                  destroyOnClose: true,
                }}
              >
                <ProFormSelect
                  name="roleIds"
                  label="角色"
                  mode="multiple"
                  request={async () => {
                    const roles = await getRoles();
                    return roles.map(role => ({
                      label: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
                      value: role.id,
                    }));
                  }}
                  rules={[{ required: true, message: '请选择角色' }]}
                />
              </ModalForm>
              <a onClick={() => showAssignDepartmentModal()}>
                批量加入部门
              </a>
            </Space>
          );
        }}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: departmentStatus,
            items: [
              {
                key: 'all',
                label: '全部',
              },
              {
                key: 'in',
                label: '已加入部门',
              },
              {
                key: 'out',
                label: '未加入部门',
              },
            ],
            onChange: (key) => {
              setDepartmentStatus(key as 'all' | 'in' | 'out');
              actionRef.current?.reload();
            },
          },
          search: {
            onSearch: (value) => {
              setSearchKeyword(value);
              actionRef.current?.reload();
            },
            placeholder: '请输入关键字搜索,ESC取消输入',
            style: {
              width: '300px',
            },
          },
          actions: [
            <ModalForm<User>
              key="add"
              title="添加用户"
              trigger={
                <Button type="primary" icon={<PlusOutlined />}>
                  添加用户
                </Button>
              }
              initialValues={{
                status: true,
              }}
              onFinish={handleSaveUser}
              modalProps={{
                destroyOnClose: true,
              }}
              width={600}
            >
              <ProForm.Group>
                <ProFormText
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                  width="md"
                />
                <ProFormText.Password
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                  width="md"
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormText
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                  width="md"
                />
                <ProFormText
                  name="email"
                  label="邮箱"
                  rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                  width="md"
                />
              </ProForm.Group>
              <ProForm.Group>
                <ProFormText
                  name="phone"
                  label="手机号"
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
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={{
          pageSize: 10,
          showQuickJumper: true,
          showSizeChanger: true,
        }}
        dateFormatter="string"
      />

      {/* 重置密码对话框 */}
      <ModalForm
        title="重置密码"
        open={resetPasswordVisible}
        onFinish={async (values) => {
          const success = await handleResetPassword(values);
          if (success) {
            setResetPasswordVisible(false);
            setCurrentUser(null);
          }
          return success;
        }}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setResetPasswordVisible(false);
            setCurrentUser(null);
          },
        }}
      >
        <ProFormText.Password
          name="password"
          label="新密码"
          rules={[{ required: true, message: '请输入新密码' }]}
        />
        <ProFormDependency name={['password']}>
          {({ password }) => (
            <ProFormText.Password
              name="confirmPassword"
              label="确认密码"
              rules={[
                { required: true, message: '请确认密码' },
                {
                  validator: (_, value) =>
                    value === password
                      ? Promise.resolve()
                      : Promise.reject(new Error('两次输入的密码不一致')),
                },
              ]}
            />
          )}
        </ProFormDependency>
      </ModalForm>

      {/* 分配角色对话框 */}
      <ModalForm
        title={currentUser ? "分配角色" : "批量分配角色"}
        open={!!currentUser && roles.length > 0}
        onFinish={handleSaveUserRoles}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setCurrentUser(null);
            setRoles([]);
          },
        }}
      >
        <ProFormSelect
          name="roleIds"
          label="角色"
          mode="multiple"
          options={roles.map(role => ({
            label: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
            value: role.id,
          }))}
          rules={[{ required: true, message: '请选择角色' }]}
        />
      </ModalForm>

      {/* 加入部门对话框（支持单个和批量） */}
      <Modal
        title={currentAssignUserId ? '加入部门' : '批量加入部门'}
        open={departmentModalVisible}
        onOk={handleBatchAssignDepartment}
        onCancel={() => {
          setDepartmentModalVisible(false);
          setSelectedDepartmentId(null);
          setCurrentAssignUserId(null);
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