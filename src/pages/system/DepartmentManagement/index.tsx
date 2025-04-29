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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { Department, getAllDepartments, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus } from '../../../services/department';
import { ApiError } from '../../../services/api';
import type { ColumnsType } from 'antd/es/table';
import AssignUsersModal from './AssignUsersModal';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加部门');
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [assignUsersModalVisible, setAssignUsersModalVisible] = useState<boolean>(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // 获取部门列表
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        setDepartments(result);
        // 构建树形选择数据
        const treeSelectData = formatTreeSelectData([
          { id: 0, name: '根部门', parentId: -1 } as Department,
          ...result
        ]);
        setTreeData(treeSelectData);
      } else {
        setDepartments([]);
        setTreeData([{ title: '根部门', value: 0, key: 0 }]);
        message.warning('获取部门列表数据格式不正确');
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 将部门列表转换为TreeSelect需要的数据格式
  const formatTreeSelectData = (data: Department[]): any[] => {
    return data.map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children && item.children.length > 0 ? formatTreeSelectData(item.children) : undefined,
    }));
  };

  // 递归处理部门数据，用于表格展示
  const processDepartmentData = (data: Department[]): Department[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(dept => dept && dept.parentId === 0)
      .map(dept => {
        const children = getChildren(data, dept.id);
        return {
          ...dept,
          // 只有当有子部门时才添加 children 属性
          ...(children.length > 0 ? { children } : {})
        };
      });
  };

  // 获取子部门
  const getChildren = (data: Department[], parentId: number): Department[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data
      .filter(dept => dept && dept.parentId === parentId)
      .map(dept => {
        const children = getChildren(data, dept.id);
        return {
          ...dept,
          // 只有当有子部门时才添加 children 属性
          ...(children.length > 0 ? { children } : {})
        };
      });
  };

  useEffect(() => {
    fetchDepartments();
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
      form.setFieldsValue({ parentId: 0, sort: 0, status: true });
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

  // 更新部门状态
  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      const status = checked ? 1 : 0;
      const statusText = status === 1 ? '启用' : '禁用';
      await updateDepartmentStatus(id, status);
      message.success(`部门${statusText}成功，已同步更新所有子部门状态`);
      fetchDepartments();
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

  const columns: ColumnsType<Department> = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number, record: Department) => (
        <Switch
          checkedChildren="启用"
          unCheckedChildren="禁用"
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
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
      render: (_, record) => (
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
            icon={<UserOutlined />}
            onClick={() => handleAssignUsers(record)}
          >
            分配用户
          </Button>
          <Popconfirm
            title="确定要删除该部门吗？"
            onConfirm={() => handleDelete(record.id)}
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
      title="部门管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrEdit()}>
          添加部门
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={processDepartmentData(departments)}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSaveDepartment}
        onCancel={() => setModalVisible(false)}
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
              treeData={treeData}
              placeholder="请选择上级部门"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
      <AssignUsersModal
        open={assignUsersModalVisible}
        departmentId={selectedDepartmentId}
        onClose={handleAssignUsersClose}
        onSuccess={fetchDepartments}
      />
    </Card>
  );
};

export default DepartmentManagement; 