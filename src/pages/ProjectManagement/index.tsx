import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Project {
  id: number;
  name: string;
  manager: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
}

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ProjectManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 模拟数据
  const [projects] = useState<Project[]>([
    {
      id: 1,
      name: '企业管理系统开发',
      manager: '张三',
      status: '进行中',
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      description: '开发一套完整的企业管理系统',
    },
    {
      id: 2,
      name: '移动端APP开发',
      manager: '李四',
      status: '规划中',
      startDate: '2024-04-01',
      endDate: '2024-08-31',
      description: '开发企业移动端应用',
    },
  ]);

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '项目经理',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      dates: [project.startDate, project.endDate],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (project: Project) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目 ${project.name} 吗？`,
      onOk() {
        message.success('删除成功');
      },
    });
  };

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const [startDate, endDate] = values.dates;
      const projectData = {
        ...values,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      delete projectData.dates;

      message.success(editingProject ? '更新成功' : '添加成功');
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加项目
        </Button>
      </div>
      <Table columns={columns} dataSource={projects} rowKey="id" />

      <Modal
        title={editingProject ? '编辑项目' : '添加项目'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="manager"
            label="项目经理"
            rules={[{ required: true, message: '请输入项目经理' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择项目状态' }]}
          >
            <Select>
              <Select.Option value="规划中">规划中</Select.Option>
              <Select.Option value="进行中">进行中</Select.Option>
              <Select.Option value="已完成">已完成</Select.Option>
              <Select.Option value="已暂停">已暂停</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dates"
            label="项目周期"
            rules={[{ required: true, message: '请选择项目周期' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectManagement; 