import React, { useRef } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

// 定义拉线数据类型
interface ProductionLine {
  id: number;
  name: string;
  code: string;
  description?: string;
  capacity: number;
  status: number;
  createdAt: string;
}

const LineManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // ProTable 列定义
  const columns: ProColumns<ProductionLine>[] = [
    {
      title: '拉线编号',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '拉线名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: '标准产能',
      dataIndex: 'capacity',
      sorter: true,
      search: false,
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
          onChange={(checked) => {
            message.info('功能开发中...');
          }}
          checkedChildren="启用"
          unCheckedChildren="禁用"
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
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<ProductionLine>
            title="编辑拉线"
            trigger={
              <Tooltip title="编辑">
                <Button type="link" icon={<EditOutlined />} />
              </Tooltip>
            }
            initialValues={record}
            onFinish={async (values) => {
              message.info('功能开发中...');
              return true;
            }}
            modalProps={{
              destroyOnClose: true,
            }}
          >
            <ProForm.Group>
              <ProFormText
                name="code"
                label="拉线编号"
                rules={[{ required: true, message: '请输入拉线编号' }]}
                width="md"
              />
              <ProFormText
                name="name"
                label="拉线名称"
                rules={[{ required: true, message: '请输入拉线名称' }]}
                width="md"
              />
            </ProForm.Group>
            <ProFormTextArea
              name="description"
              label="描述"
              width="xl"
            />
            <ProFormDigit
              name="capacity"
              label="标准产能"
              rules={[{ required: true, message: '请输入标准产能' }]}
              min={0}
              width="md"
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该拉线吗？"
            onConfirm={() => {
              message.info('功能开发中...');
            }}
          >
            <Tooltip title="删除">
              <Button type="link" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable<ProductionLine>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params = {}, sort, filter) => {
        // TODO: 替换为实际的API调用
        return {
          data: [],
          success: true,
          total: 0,
        };
      }}
      editable={{
        type: 'multiple',
      }}
      columnsState={{
        persistenceKey: 'production-line-table',
        persistenceType: 'localStorage',
      }}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      options={{
        density: true,
        fullScreen: true,
        reload: true,
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
      headerTitle="拉线管理"
      toolBarRender={() => [
        <ModalForm<ProductionLine>
          key="create"
          title="新建拉线"
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建拉线
            </Button>
          }
          onFinish={async (values) => {
            message.info('功能开发中...');
            return true;
          }}
          modalProps={{
            destroyOnClose: true,
          }}
        >
          <ProForm.Group>
            <ProFormText
              name="code"
              label="拉线编号"
              rules={[{ required: true, message: '请输入拉线编号' }]}
              width="md"
            />
            <ProFormText
              name="name"
              label="拉线名称"
              rules={[{ required: true, message: '请输入拉线名称' }]}
              width="md"
            />
          </ProForm.Group>
          <ProFormTextArea
            name="description"
            label="描述"
            width="xl"
          />
          <ProFormDigit
            name="capacity"
            label="标准产能"
            rules={[{ required: true, message: '请输入标准产能' }]}
            min={0}
            width="md"
          />
        </ModalForm>,
      ]}
    />
  );
};

export default LineManagement; 