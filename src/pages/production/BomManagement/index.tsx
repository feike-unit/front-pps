import React, { useRef } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Table,
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

// 定义BOM数据类型
interface Bom {
  id: number;
  productCode: string;
  productName: string;
  version: string;
  status: number;
  description?: string;
  createdAt: string;
}

// 定义BOM明细数据类型
interface BomDetail {
  id: number;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  remark?: string;
}

const BomManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // BOM明细表格列定义
  const detailColumns = [
    {
      title: '物料编号',
      dataIndex: 'materialCode',
      key: 'materialCode',
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  // ProTable 列定义
  const columns: ProColumns<Bom>[] = [
    {
      title: '产品编号',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'BOM版本',
      dataIndex: 'version',
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
          <ModalForm<Bom>
            title="编辑BOM"
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
              width: 1000,
            }}
          >
            <ProForm.Group>
              <ProFormSelect
                name="productCode"
                label="产品"
                rules={[{ required: true, message: '请选择产品' }]}
                width="md"
                options={[]} // TODO: 从后端获取产品列表
              />
              <ProFormText
                name="version"
                label="BOM版本"
                rules={[{ required: true, message: '请输入BOM版本' }]}
                width="md"
              />
            </ProForm.Group>
            <ProFormTextArea
              name="description"
              label="描述"
              width="xl"
            />
            <div style={{ marginTop: 24 }}>
              <Table
                columns={detailColumns}
                dataSource={[]} // TODO: 从后端获取BOM明细
                pagination={false}
                size="small"
                title={() => (
                  <Space>
                    <Button type="primary" size="small">
                      <PlusOutlined /> 添加物料
                    </Button>
                  </Space>
                )}
              />
            </div>
          </ModalForm>
          <Popconfirm
            title="确定要删除该BOM吗？"
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
    <ProTable<Bom>
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
        persistenceKey: 'production-bom-table',
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
      headerTitle="BOM管理"
      toolBarRender={() => [
        <ModalForm<Bom>
          key="create"
          title="新建BOM"
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建BOM
            </Button>
          }
          onFinish={async (values) => {
            message.info('功能开发中...');
            return true;
          }}
          modalProps={{
            destroyOnClose: true,
            width: 1000,
          }}
        >
          <ProForm.Group>
            <ProFormSelect
              name="productCode"
              label="产品"
              rules={[{ required: true, message: '请选择产品' }]}
              width="md"
              options={[]} // TODO: 从后端获取产品列表
            />
            <ProFormText
              name="version"
              label="BOM版本"
              rules={[{ required: true, message: '请输入BOM版本' }]}
              width="md"
            />
          </ProForm.Group>
          <ProFormTextArea
            name="description"
            label="描述"
            width="xl"
          />
          <div style={{ marginTop: 24 }}>
            <Table
              columns={detailColumns}
              dataSource={[]} // TODO: 从后端获取BOM明细
              pagination={false}
              size="small"
              title={() => (
                <Space>
                  <Button type="primary" size="small">
                    <PlusOutlined /> 添加物料
                  </Button>
                </Space>
              )}
            />
          </div>
        </ModalForm>,
      ]}
    />
  );
};

export default BomManagement; 