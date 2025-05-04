import React, { useRef } from 'react';
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  TreeSelect,
  Tag,
  Tooltip,
  Tree,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CaretDownOutlined, CaretRightOutlined, TeamOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormTreeSelect, ProFormSwitch } from '@ant-design/pro-components';
import { Department, getAllDepartments, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus, getDepartmentUsers } from '../../../services/department';
import { ApiError } from '../../../services/api';
import AssignUsersModal from './AssignUsersModal';
import type { UserInfo } from '../../../services/user';
import { removeUserFromDepartment } from '../../../services/user';

// 部门用户组件
const DepartmentUsers: React.FC<{ departmentId: number; refreshKey: number }> = ({ departmentId, refreshKey }) => {
  const [users, setUsers] = React.useState<UserInfo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [popconfirmVisible, setPopconfirmVisible] = React.useState<number | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDepartmentUsers(departmentId);
      setUsers(data);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  const handleRemoveUser = async (userId: number) => {
    try {
      await removeUserFromDepartment(userId, departmentId);
      message.success('移除用户关系成功');
      fetchUsers();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '移除用户关系失败');
    } finally {
      setPopconfirmVisible(null);
    }
  };

  if (loading) {
    return <span>加载中...</span>;
  }

  return (
    <Space wrap>
      {users.map(user => (
        <Popconfirm
          key={user.id}
          title="确定要移除该用户关系吗？"
          open={popconfirmVisible === user.id}
          onConfirm={() => handleRemoveUser(user.id)}
          onCancel={() => setPopconfirmVisible(null)}
          okText="确定"
          cancelText="取消"
        >
          <Tag 
            closable 
            onClose={(e) => {
              e.preventDefault();
              setPopconfirmVisible(user.id);
            }}
          >
            {user.username}
          </Tag>
        </Popconfirm>
      ))}
    </Space>
  );
};

const DepartmentManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentDepartment, setCurrentDepartment] = React.useState<Department | null>(null);
  const [assignUsersModalVisible, setAssignUsersModalVisible] = React.useState<boolean>(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<number | null>(null);
  const [refreshUserListKey, setRefreshUserListKey] = React.useState<number>(0);
  const [treeData, setTreeData] = React.useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = React.useState<number[]>([]);
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);

  // 将部门列表转换为树形结构
  const convertToTreeData = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const result: Department[] = [];

    // 先创建所有节点的副本
    departments.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] });
    });

    // 构建树形结构
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

  // 将部门列表转换为TreeSelect需要的数据格式
  const formatTreeSelectData = (data: Department[]): any[] => {
    return data.map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children && item.children.length > 0 
        ? formatTreeSelectData(item.children) 
        : undefined,
    }));
  };

  // 获取部门树形选择数据
  const fetchTreeSelectData = async () => {
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        // 设置默认展开的根节点
        const rootDepartments = result.filter(dept => dept.parentId === 0);
        setExpandedKeys(rootDepartments.map(dept => dept.id));
        
        // 转换为树形结构
        const treeData = convertToTreeSelectData(result);
        setTreeData(treeData);
      } else {
        setTreeData([]);
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    }
  };

  // 将部门列表转换为树形结构的 TreeSelect 数据
  const convertToTreeSelectData = (departments: Department[]): any[] => {
    const map = new Map<number, any>();
    const result: any[] = [];

    // 先创建所有节点
    departments.forEach(dept => {
      map.set(dept.id, {
        title: dept.name,
        value: dept.id,
        key: dept.id,
        children: [],
      });
    });

    // 构建树形结构
    departments.forEach(dept => {
      const node = map.get(dept.id);
      if (dept.parentId === 0) {
        result.push(node);
      } else {
        const parent = map.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // 移除空的 children 数组
    const removeEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.children.length === 0) {
          const { children, ...rest } = node;
          return rest;
        }
        return {
          ...node,
          children: removeEmptyChildren(node.children),
        };
      });
    };

    return removeEmptyChildren(result);
  };


  // 添加或编辑部门
  const handleAddOrEdit = async (department?: Department) => {
    // 重新获取最新的部门树数据
    await fetchTreeSelectData();
    setCurrentDepartment(department || null);
    setModalVisible(true);
  };

  // 保存部门
  const handleSaveDepartment = async (values: any) => {
    try {
      const params = {
        ...values,
        status: values.status ? 1 : 0,
      };
      
      if (currentDepartment) {
        await updateDepartment(currentDepartment.id, params);
        message.success('部门更新成功');
      } else {
        await createDepartment(params);
        message.success('部门创建成功');
      }
      
      setModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存失败');
      return false;
    }
  };

  // 删除部门
  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success('部门删除成功');
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除部门失败');
    }
  };

  // 更新部门状态
  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      const status = checked ? 1 : 0;
      const statusText = status === 1 ? '启用' : '禁用';
      await updateDepartmentStatus(id, status);
      message.success(`部门${statusText}成功，已同步更新所有子部门状态`);
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '状态更新失败');
    }
  };

  // 打开分配用户对话框
  const handleAssignUsers = (department: Department) => {
    setSelectedDepartmentId(department.id);
    setAssignUsersModalVisible(true);
  };

  // 关闭分配用户对话框
  const handleAssignUsersClose = () => {
    setAssignUsersModalVisible(false);
    setSelectedDepartmentId(null);
  };

  // 用户分配成功的回调
  const handleAssignUsersSuccess = () => {
    setRefreshUserListKey(prev => prev + 1);
  };

  const columns: ProColumns<Department>[] = [
    {
      title: '部门名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      order: 1,
      render: (_, record) => record.name,
    },
    {
      title: '用户列表',
      dataIndex: 'users',
      search: false,
      render: (_, record) => (
        <DepartmentUsers 
          key={`${record.id}-${refreshUserListKey}`} 
          departmentId={record.id}
          refreshKey={refreshUserListKey}
        />
      ),
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
          checkedChildren="启用"
          unCheckedChildren="禁用"
          checked={record.status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
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
          <Button 
            type="link" 
            style={{ padding: 0 }} 
            onClick={() => handleAddOrEdit(record)}
          >
            <EditOutlined />
          </Button>
          <Button 
            type="link" 
            style={{ padding: 0 }} 
            onClick={() => handleAssignUsers(record)}
          >
            <TeamOutlined />
          </Button>
          <Popconfirm
            title="确定要删除该部门吗？"
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
      <ProTable<Department>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params = {}, sort, filter) => {
          try {
            const result = await getAllDepartments();
            const treeData = convertToTreeData(result);
            // 如果还没有设置展开的键,设置根节点为展开状态
            if (expandedKeys.length === 0) {
              const rootDepartments = result.filter(dept => dept.parentId === 0);
              setExpandedKeys(rootDepartments.map(dept => dept.id));
            }
            return {
              data: treeData,
              success: true,
            };
          } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
            return {
              data: [],
              success: false,
            };
          }
        }}
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'department-management-table',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        toolbar={{
          actions: [
            <Button
              key="button"
              type="primary"
              onClick={() => handleAddOrEdit()}
            >
              <PlusOutlined /> 添加部门
            </Button>,
          ],
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={false}
        dateFormatter="string"
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
          expandIcon: ({ expanded, onExpand, record }) => {
            if (record.children && record.children.length > 0) {
              return expanded ? (
                <CaretDownOutlined onClick={e => onExpand(record, e)} />
              ) : (
                <CaretRightOutlined onClick={e => onExpand(record, e)} />
              );
            }
            return null;
          },
        }}
        childrenColumnName="children"
        indentSize={24}
      />

      <ModalForm
        title={currentDepartment ? '编辑部门' : '添加部门'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={{
          parentId: currentDepartment?.parentId || 0,
          name: currentDepartment?.name,
          sort: currentDepartment?.sort || 0,
          status: currentDepartment ? currentDepartment.status === 1 : true,
        }}
        onFinish={handleSaveDepartment}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormTreeSelect
          name="parentId"
          label="上级部门"
          tooltip="不选择则为顶级部门"
          fieldProps={{
            treeData,
            treeDefaultExpandAll: true,
            disabled: currentDepartment?.id === 1,
          }}
          rules={[{ required: false }]}
        />
        <ProFormText
          name="name"
          label="部门名称"
          rules={[
            { required: true, message: '请输入部门名称' },
            { max: 50, message: '部门名称不能超过50个字符' }
          ]}
        />
        <ProFormDigit
          name="sort"
          label="排序号"
          tooltip="数字越小越靠前"
          fieldProps={{
            precision: 0,
            min: 0,
          }}
          rules={[{ required: true, message: '请输入排序号' }]}
        />
        <ProFormSwitch
          name="status"
          label="状态"
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      </ModalForm>

      <AssignUsersModal
        open={assignUsersModalVisible}
        departmentId={selectedDepartmentId}
        onClose={handleAssignUsersClose}
        onSuccess={handleAssignUsersSuccess}
      />
    </>
  );
};

// 递归禁用当前部门及其子部门
const disableCurrentAndChildren = (treeData: any[], currentId: number): any[] => {
  return treeData.map(node => {
    if (node.value === currentId) {
      return { ...node, disabled: true };
    }
    if (node.children) {
      return {
        ...node,
        children: disableCurrentAndChildren(node.children, currentId)
      };
    }
    return node;
  });
};

export default DepartmentManagement; 