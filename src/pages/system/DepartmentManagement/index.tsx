import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  TreeSelect,
  Select,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Department, getDepartmentTree, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus, assignUsersToDepartment } from '../../../services/department';
import { getUsers, User } from '../../../services/user';
import { ApiError } from '../../../types/api';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加部门');
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);

  // 获取部门树结构
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await getDepartmentTree();
      setDepartments(result.data);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const result = await getUsers();
      setUsers(result.data);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取用户列表失败');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 添加或编辑部门
  const handleAddOrEdit = (department?: Department) => {
    if (department) {
      setModalTitle('编辑部门');
      setCurrentDepartment(department);
      form.setFieldsValue({
        name: department.name,
        parentId: department.parentId,
        sort: department.sort,
        status: department.status === 1,
      });
    } else {
      setModalTitle('添加部门');
      setCurrentDepartment(null);
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
    setModalVisible(true);
  };

  // 保存部门
  const handleSaveDepartment = async () => {
    try {
      const values = await form.validateFields();
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
      fetchDepartments();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '保存部门失败');
    }
  };

  // 删除部门
  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success('部门删除成功');
      fetchDepartments();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '删除部门失败');
    }
  };

  // 处理部门状态变更
  const handleStatusChange = async (checked: boolean, department: Department) => {
    try {
      await updateDepartmentStatus(department.id, checked ? 1 : 0);
      message.success('部门状态更新成功');
      fetchDepartments();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '部门状态更新失败');
    }
  };

  // 显示分配用户对话框
  const showUserModal = async (department: Department) => {
    try {
      setCurrentDepartment(department);
      userForm.resetFields();
      setUserModalVisible(true);
    } catch (error) {
      message.error('获取用户列表失败');
    }
  };

  // 保存用户分配
  const handleSaveUsers = async (selectedUserIds: number[]) => {
    if (!currentDepartment) return;
    
    try {
      await assignUsersToDepartment(currentDepartment.id, selectedUserIds);
      message.success('用户分配成功');
      setUserModalVisible(false);
      fetchDepartments(); // 刷新部门列表
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '用户分配失败');
    }
  };

  // 将部门列表转换为TreeSelect的数据格式
  const transformToTreeData = (departments: Department[]): any[] => {
    if (!departments) return [];
    return departments.map(dept => ({
      title: dept.name,
      value: dept.id,
      children: dept.children ? transformToTreeData(dept.children) : undefined,
    }));
  };

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: Department) => (
        <Popconfirm
          title={`确定要${status === 1 ? '禁用' : '启用'}该部门吗？`}
          onConfirm={() => handleStatusChange(status === 0, record)}
          okText="确定"
          cancelText="取消"
        >
          <Switch
            checked={status === 1}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </Popconfirm>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: Department) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleAddOrEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<UserSwitchOutlined />}
            onClick={() => showUserModal(record)}
          >
            分配用户
          </Button>
          <Popconfirm
            title="确定要删除该部门吗？"
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

  const AssignUsersModal: React.FC<{
    open: boolean;
    onCancel: () => void;
    onOk: (selectedUserIds: number[]) => void;
    departmentId: number;
  }> = ({ open, onCancel, onOk, departmentId }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const response = await getUsers();
          setUsers(response);
        } catch (error) {
          const apiError = error as ApiError;
          message.error(apiError.response?.data?.message || apiError.message || '获取用户列表失败');
        } finally {
          setLoading(false);
        }
      };

      if (open) {
        fetchUsers();
      }
    }, [open]);

    const handleOk = () => {
      onOk(selectedUserIds);
    };

    return (
      <Modal
        title="分配用户"
        open={open}
        onCancel={onCancel}
        onOk={handleOk}
        width={600}
      >
        <Spin spinning={loading}>
          <Table
            rowSelection={{
              type: 'checkbox',
              onChange: (selectedRowKeys) => {
                setSelectedUserIds(selectedRowKeys as number[]);
              },
            }}
            dataSource={users}
            columns={[
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
            ]}
            rowKey="id"
          />
        </Spin>
      </Modal>
    );
  };

  return (
    <Card
      title="部门管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加部门
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={departments}
        rowKey="id"
        loading={loading}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
        }}
      />

      {/* 添加/编辑部门对话框 */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveDepartment}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="上级部门"
            rules={[{ required: true, message: '请选择上级部门' }]}
          >
            <TreeSelect
              treeData={[
                { title: '总公司', value: 0 },
                ...(departments ? transformToTreeData(departments) : []),
              ]}
              placeholder="请选择上级部门"
              treeDefaultExpandAll
              disabled={currentDepartment?.id === 1}
            />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户分配对话框 */}
      <AssignUsersModal
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        onOk={handleSaveUsers}
        departmentId={currentDepartment?.id}
      />
    </Card>
  );
};

export default DepartmentManagement; 