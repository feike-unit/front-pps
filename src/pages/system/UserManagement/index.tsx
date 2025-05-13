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
  Tooltip,
  Spin,
} from 'antd';
import type { TreeProps, DataNode } from 'antd/es/tree';
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
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined, TeamOutlined } from '@ant-design/icons';
import { 
  User, 
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
  getUserPage,
} from '../../../services/user';
import type { Department } from '../../../services/department';
import { getAllDepartments, assignUsersToDepartment } from '../../../services/department';
import { Role, getRoles } from '../../../services/role';
import type { ApiError } from '../../../services/api';

interface UserType {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  departments?: Department[];
  roles?: string[];
}

// 用户所属部门组件
const UserDepartments: React.FC<{ departments: Department[]; userId: number; onRemove?: () => void }> = ({ departments, userId, onRemove }) => {
  const [loading, setLoading] = React.useState(false);
  const [popconfirmVisible, setPopconfirmVisible] = React.useState<number | null>(null);
  const actionRef = useRef<ActionType>();

  const handleRemoveDepartment = async (departmentId: number, userId: number) => {
    try {
      await removeUserFromDepartment(userId, departmentId);
      message.success('移除成功');
      if (onRemove) {
        onRemove();
      }
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '移除失败');
    } finally {
      setPopconfirmVisible(null);
    }
  };

  return (
    <Space>
      {loading ? (
        <Spin size="small" />
      ) : (
        departments.map(dept => (
          <Tag
            key={dept.id}
            closable
            onClose={(e) => {
              e.preventDefault();
              setPopconfirmVisible(dept.id);
            }}
          >
            <Popconfirm
              title="确定要移除该部门吗？"
              open={popconfirmVisible === dept.id}
              onConfirm={() => handleRemoveDepartment(dept.id, userId)}
              onCancel={() => setPopconfirmVisible(null)}
            >
              {dept.name}
            </Popconfirm>
          </Tag>
        ))
      )}
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
  const [departmentStatus, setDepartmentStatus] = React.useState<string>('all');
  const [departmentModalVisible, setDepartmentModalVisible] = React.useState<boolean>(false);
  const [departments, setDepartments] = React.useState<DataNode[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<number[]>([]);
  const [currentAssignUserId, setCurrentAssignUserId] = React.useState<number | null>(null);
  const [departmentDisplayKey, setDepartmentDisplayKey] = React.useState<number>(0);
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');
  const [resetPasswordVisible, setResetPasswordVisible] = React.useState<boolean>(false);
  const [tableDataSource, setTableDataSource] = React.useState<User[]>([]);
  const [addUserDepartments, setAddUserDepartments] = React.useState<DataNode[]>([]);
  const [addUserSelectedDepartmentIds, setAddUserSelectedDepartmentIds] = React.useState<number[]>([]);
  const [editUserDepartments, setEditUserDepartments] = React.useState<DataNode[]>([]);
  const [editUserSelectedDepartmentIds, setEditUserSelectedDepartmentIds] = React.useState<number[]>([]);
  const [departmentPopconfirmVisible, setDepartmentPopconfirmVisible] = React.useState<{userId: number, deptId: number} | null>(null);

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
  const formatDepartmentTreeData = (data: Department[]): DataNode[] => {
    return data.map(item => ({
      key: item.id,
      title: item.name,
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

  // 获取添加用户时的部门树数据
  const fetchAddUserDepartments = async () => {
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        const treeData = formatDepartmentTreeData(convertToTreeData(result));
        setAddUserDepartments(treeData);
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    }
  };

  // 获取编辑用户时的部门树数据
  const fetchEditUserDepartments = async () => {
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        const treeData = formatDepartmentTreeData(convertToTreeData(result));
        setEditUserDepartments(treeData);
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
        departmentIds: user.departments?.map(dept => dept.id),
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
        departmentIds: addUserSelectedDepartmentIds,
      };

      if (values.id) {
        await updateUser(params);
        message.success('用户更新成功');
      } else {
        await createUser(params);
        message.success('用户创建成功');
      }
      actionRef.current?.reload();
      setAddUserSelectedDepartmentIds([]);
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
        // 找到用户当前角色对应的ID
        const userRoleIds = user.roles?.map(roleName => 
          result.find(r => r.name === roleName)?.id
        ).filter(Boolean) as number[];
        
        // 重置表单并设置初始值
        roleForm.resetFields();
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
      // 从表格数据源中获取用户信息
      const currentUser = tableDataSource.find(user => user.id === userId);
      if (currentUser?.departments && currentUser.departments.length > 0) {
        // 如果用户有部门，设置已有部门为选中状态
        setSelectedDepartmentIds(currentUser.departments.map(dept => dept.id));
      } else {
        setSelectedDepartmentIds([]);
      }
    } else {
      if (selectedRowKeys.length === 0) {
        message.warning('请先选择用户');
        return;
      }
      setCurrentAssignUserId(null);
      setSelectedDepartmentIds([]);
    }
    // 获取部门数据
    await fetchDepartments();
    setDepartmentModalVisible(true);
  };

  // 处理部门选择
  const handleDepartmentSelect = (selectedKeys: React.Key[]) => {
    setSelectedDepartmentIds(selectedKeys.map(key => Number(key)));
  };

  // 处理批量加入部门
  const handleBatchAssignDepartment = async () => {
    if (selectedDepartmentIds.length === 0) {
      message.error('请选择部门');
      return;
    }

    try {
      const userIds = currentAssignUserId 
        ? [currentAssignUserId] 
        : selectedRowKeys.map(key => Number(key));

      // 为每个选中的部门分配用户
      for (const departmentId of selectedDepartmentIds) {
        await assignUsersToDepartment(departmentId, userIds);
      }
      
      message.success('用户加入部门成功');
      setDepartmentModalVisible(false);
      setSelectedDepartmentIds([]);
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

  // 处理移除部门
  const handleRemoveDepartment = async (userId: number, departmentId: number) => {
    try {
      await removeUserFromDepartment(userId, departmentId);
      message.success('移除成功');
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '移除失败');
    } finally {
      setDepartmentPopconfirmVisible(null);
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
      dataIndex: 'departments',
      search: false,
      width: 200,
      render: (_, record) => departmentStatus !== 'out' ? (
        <Tooltip 
          title={record.departments?.map(dept => dept.name).join(', ')}
          placement="topLeft"
        >
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            <Space wrap size={[0, 4]}>
              {(record.departments || []).slice(0, 3).map((dept) => (
                <Tag 
                  key={dept.id}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    setDepartmentPopconfirmVisible({ userId: record.id, deptId: dept.id });
                  }}
                >
                  <Popconfirm
                    title="确定要移除该部门吗？"
                    open={departmentPopconfirmVisible?.userId === record.id && departmentPopconfirmVisible?.deptId === dept.id}
                    onConfirm={() => handleRemoveDepartment(record.id, dept.id)}
                    onCancel={() => setDepartmentPopconfirmVisible(null)}
                  >
                    {dept.name}
                  </Popconfirm>
                </Tag>
              ))}
              {(record.departments || []).length > 3 && (
                <Tag>+{(record.departments || []).length - 3}</Tag>
              )}
            </Space>
          </div>
        </Tooltip>
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
      width: 200,
      render: (_, record) => (
        <Tooltip 
          title={record.roles?.join(', ')}
          placement="topLeft"
        >
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            <Space wrap size={[0, 4]}>
              {(record.roles || []).slice(0, 3).map((roleName) => (
                <Tag key={roleName}>{roleName}</Tag>
              ))}
              {(record.roles || []).length > 3 && (
                <Tag>+{(record.roles || []).length - 3}</Tag>
              )}
            </Space>
          </div>
        </Tooltip>
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
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<User>
            key="edit"
            title="编辑用户"
            trigger={
              <Tooltip title="编辑">
                <a><EditOutlined /></a>
              </Tooltip>
            }
            initialValues={{
              ...record,
              status: record.status === 1,
            }}
            onFinish={async (values) => {
              try {
                const params = {
                  ...values,
                  status: values.status ? 1 : 0,
                  departmentIds: editUserSelectedDepartmentIds,
                };
                await updateUser(params);
                message.success('用户更新成功');
                actionRef.current?.reload();
                setEditUserSelectedDepartmentIds([]);
                return true;
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '保存用户失败');
                return false;
              }
            }}
            modalProps={{
              destroyOnClose: true,
              onCancel: () => {
                setEditUserSelectedDepartmentIds([]);
              },
            }}
            onOpenChange={async (visible) => {
              if (visible) {
                await fetchEditUserDepartments();
                // 设置已有部门的选中状态
                setEditUserSelectedDepartmentIds(record.departments?.map(dept => dept.id) || []);
              } else {
                setEditUserSelectedDepartmentIds([]);
              }
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
            <ProForm.Item
              label="所属部门"
            >
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                <Tree
                  treeData={editUserDepartments}
                  checkedKeys={editUserSelectedDepartmentIds}
                  onCheck={(checkedKeys) => {
                    const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
                    setEditUserSelectedDepartmentIds(keys.map(key => Number(key)));
                  }}
                  checkable
                  defaultExpandAll
                  defaultExpandParent
                />
              </div>
            </ProForm.Item>
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
          </ModalForm>
          <Tooltip title="重置密码">
            <a
              key="reset_password"
              onClick={() => {
                setCurrentUser(record);
                setResetPasswordVisible(true);
              }}
            >
              <KeyOutlined />
            </a>
          </Tooltip>
          <Tooltip title="分配角色">
            <a
              key="assign_role"
              onClick={async () => {
                await showRoleModal(record);
              }}
            >
              <UserSwitchOutlined />
            </a>
          </Tooltip>
          <Tooltip title="分配部门">
            <a
              key="assign_department"
              onClick={() => showAssignDepartmentModal(record.id)}
            >
              <TeamOutlined />
            </a>
          </Tooltip>
          <Popconfirm
            key="delete"
            title="确定要删除该用户吗？"
            onConfirm={async () => {
              try {
                await deleteUser(record.id);
                message.success('用户删除成功');
                actionRef.current?.reload();
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '删除用户失败');
              }
            }}
          >
            <Tooltip title="删除">
              <a><DeleteOutlined style={{ color: '#ff4d4f' }} /></a>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<User>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        bordered
        defaultSize="small"
        request={async (params = {}, sort, filter) => {
          const response = await getUserPage({
            pageNum: params.current,
            pageSize: params.pageSize || 10,  // 默认每页显示10条
            keyword: searchKeyword,
            departmentStatus,
            sortField: params.sortField,
            sortOrder: params.sortOrder,
          });
          // 保存数据源
          setTableDataSource(response.list);
          return {
            data: response.list,
            success: true,
            total: response.total,
          };
        }}
        columnsState={{
          persistenceKey: 'user-management-table',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        headerTitle={
          <Space>
            <Input.Search
              placeholder="请输入关键字搜索,ESC取消输入"
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
            <Radio.Group
              value={departmentStatus}
              onChange={(e) => {
                setDepartmentStatus(e.target.value);
                actionRef.current?.reloadAndRest?.();
              }}
              buttonStyle="solid"
            >
              <Radio.Button value="all">全部</Radio.Button>
              <Radio.Button value="in">已加入部门</Radio.Button>
              <Radio.Button value="out">未加入部门</Radio.Button>
            </Radio.Group>
          </Space>
        }
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space size={24}>
            <span>
              已选 {selectedRowKeys.length} 项
              <Button type="link" style={{ padding: '0 4px' }} onClick={onCleanSelected}>
                取消选择
              </Button>
            </span>
          </Space>
        )}
        tableAlertOptionRender={() => {
          return (
            <Space size={16}>
              <Button type="link" style={{ padding: 0 }} onClick={handleBatchDelete}>
                批量删除
              </Button>
              <ModalForm
                title="批量分配角色"
                trigger={<Button type="link" style={{ padding: 0 }}>批量分配角色</Button>}
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
              <Button 
                type="link" 
                style={{ padding: 0 }} 
                onClick={() => showAssignDepartmentModal()}
              >
                批量加入部门
              </Button>
            </Space>
          );
        }}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          selectedRowKeys,
          onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys);
          },
        }}
        toolbar={{
          actions: [
            <ModalForm<User>
              key="add"
              title="添加用户"
              trigger={
                <Button key="button" type="primary">
                  <PlusOutlined /> 添加用户
                </Button>
              }
              initialValues={{
                status: true,
              }}
              onFinish={handleSaveUser}
              modalProps={{
                destroyOnClose: true,
                onCancel: () => {
                  setAddUserSelectedDepartmentIds([]);
                },
              }}
              onOpenChange={async (visible) => {
                if (visible) {
                  await fetchAddUserDepartments();
                  setAddUserSelectedDepartmentIds([]);
                } else {
                  setAddUserSelectedDepartmentIds([]);
                }
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
              <ProForm.Item
                label="所属部门"
              >
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <Tree
                    treeData={addUserDepartments}
                    checkedKeys={addUserSelectedDepartmentIds}
                    onCheck={(checkedKeys) => {
                      const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
                      setAddUserSelectedDepartmentIds(keys.map(key => Number(key)));
                    }}
                    checkable
                    defaultExpandAll
                    defaultExpandParent
                  />
                </div>
              </ProForm.Item>
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
          defaultPageSize: 10,  // 默认每页显示10条
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100', '200'],  // 可选的每页条数
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
        open={roleModalVisible}
        form={roleForm}
        onFinish={handleSaveUserRoles}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setRoleModalVisible(false);
            setCurrentUser(null);
            setRoles([]);
            roleForm.resetFields();
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
          setSelectedDepartmentIds([]);
          setCurrentAssignUserId(null);
        }}
        width={400}
      >
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <Tree
            treeData={departments}
            onSelect={handleDepartmentSelect}
            selectedKeys={selectedDepartmentIds}
            multiple
            defaultExpandAll
            defaultExpandParent
          />
        </div>
      </Modal>
    </>
  );
};

export default UserManagement;