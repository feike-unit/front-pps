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
  ProFormSelect,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

// 定义货品数据类型
interface Product {
  id: number;
  code: string;
  name: string;
  specification: string;
  unit: string;
  category: string;
  description?: string;
  status: number;
  createdAt: string;
}

const ProductManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // ProTable 列定义
  const columns: ProColumns<Product>[] = [
    {
      title: '货品编号',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '货品名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      ellipsis: true,
      search: false,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      ellipsis: true,
      search: false,
    },
    {
      title: '类别',
      dataIndex: 'category',
      ellipsis: true,
      valueType: 'select',
      valueEnum: {
        'RAW': { text: '原材料' },
        'SEMI': { text: '半成品' },
        'FINISHED': { text: '成品' },
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
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
          <ModalForm<Product>
            title="编辑货品"
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
                label="货品编号"
                rules={[{ required: true, message: '请输入货品编号' }]}
                width="md"
              />
              <ProFormText
                name="name"
                label="货品名称"
                rules={[{ required: true, message: '请输入货品名称' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="specification"
                label="规格型号"
                rules={[{ required: true, message: '请输入规格型号' }]}
                width="md"
              />
              <ProFormText
                name="unit"
                label="单位"
                rules={[{ required: true, message: '请输入单位' }]}
                width="md"
              />
            </ProForm.Group>
            <ProFormSelect
              name="category"
              label="类别"
              options={[
                { label: '原材料', value: 'RAW' },
                { label: '半成品', value: 'SEMI' },
                { label: '成品', value: 'FINISHED' },
              ]}
              rules={[{ required: true, message: '请选择类别' }]}
              width="md"
            />
            <ProFormTextArea
              name="description"
              label="描述"
              width="xl"
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该货品吗？"
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
    <ProTable<Product>
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
        persistenceKey: 'production-product-table',
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
      headerTitle="货品管理"
      toolBarRender={() => [
        <ModalForm<Product>
          key="create"
          title="新建货品"
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建货品
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
              label="货品编号"
              rules={[{ required: true, message: '请输入货品编号' }]}
              width="md"
            />
            <ProFormText
              name="name"
              label="货品名称"
              rules={[{ required: true, message: '请输入货品名称' }]}
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="specification"
              label="规格型号"
              rules={[{ required: true, message: '请输入规格型号' }]}
              width="md"
            />
            <ProFormText
              name="unit"
              label="单位"
              rules={[{ required: true, message: '请输入单位' }]}
              width="md"
            />
          </ProForm.Group>
          <ProFormSelect
            name="category"
            label="类别"
            options={[
              { label: '原材料', value: 'RAW' },
              { label: '半成品', value: 'SEMI' },
              { label: '成品', value: 'FINISHED' },
            ]}
            rules={[{ required: true, message: '请选择类别' }]}
            width="md"
          />
          <ProFormTextArea
            name="description"
            label="描述"
            width="xl"
          />
        </ModalForm>,
      ]}
    />
  );
};

export default ProductManagement; 