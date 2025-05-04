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
  ProFormDateTimePicker,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

// 定义产能规则数据类型
interface CapacityRule {
  id: number;
  lineCode: string;
  lineName: string;
  productCode: string;
  productName: string;
  capacity: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: number;
  description?: string;
  createdAt: string;
}

const CapacityRuleManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // ProTable 列定义
  const columns: ProColumns<CapacityRule>[] = [
    {
      title: '拉线编号',
      dataIndex: 'lineCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '拉线名称',
      dataIndex: 'lineName',
      ellipsis: true,
      search: false,
    },
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
      ellipsis: true,
      search: false,
    },
    {
      title: '产能',
      dataIndex: 'capacity',
      sorter: true,
      search: false,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      ellipsis: true,
      search: false,
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveFrom',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '失效时间',
      dataIndex: 'effectiveTo',
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
          <ModalForm<CapacityRule>
            title="编辑产能规则"
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
              <ProFormSelect
                name="lineCode"
                label="拉线"
                rules={[{ required: true, message: '请选择拉线' }]}
                width="md"
                options={[]} // TODO: 从后端获取拉线列表
              />
              <ProFormSelect
                name="productCode"
                label="产品"
                rules={[{ required: true, message: '请选择产品' }]}
                width="md"
                options={[]} // TODO: 从后端获取产品列表
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDigit
                name="capacity"
                label="产能"
                rules={[{ required: true, message: '请输入产能' }]}
                min={0}
                width="md"
              />
              <ProFormText
                name="unit"
                label="单位"
                rules={[{ required: true, message: '请输入单位' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDateTimePicker
                name="effectiveFrom"
                label="生效时间"
                rules={[{ required: true, message: '请选择生效时间' }]}
                width="md"
              />
              <ProFormDateTimePicker
                name="effectiveTo"
                label="失效时间"
                rules={[{ required: true, message: '请选择失效时间' }]}
                width="md"
              />
            </ProForm.Group>
            <ProFormTextArea
              name="description"
              label="描述"
              width="xl"
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该产能规则吗？"
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
    <ProTable<CapacityRule>
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
        persistenceKey: 'production-capacity-rule-table',
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
      headerTitle="产能规则"
      toolBarRender={() => [
        <ModalForm<CapacityRule>
          key="create"
          title="新建产能规则"
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建规则
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
            <ProFormSelect
              name="lineCode"
              label="拉线"
              rules={[{ required: true, message: '请选择拉线' }]}
              width="md"
              options={[]} // TODO: 从后端获取拉线列表
            />
            <ProFormSelect
              name="productCode"
              label="产品"
              rules={[{ required: true, message: '请选择产品' }]}
              width="md"
              options={[]} // TODO: 从后端获取产品列表
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormDigit
              name="capacity"
              label="产能"
              rules={[{ required: true, message: '请输入产能' }]}
              min={0}
              width="md"
            />
            <ProFormText
              name="unit"
              label="单位"
              rules={[{ required: true, message: '请输入单位' }]}
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormDateTimePicker
              name="effectiveFrom"
              label="生效时间"
              rules={[{ required: true, message: '请选择生效时间' }]}
              width="md"
            />
            <ProFormDateTimePicker
              name="effectiveTo"
              label="失效时间"
              rules={[{ required: true, message: '请选择失效时间' }]}
              width="md"
            />
          </ProForm.Group>
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

export default CapacityRuleManagement; 