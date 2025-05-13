import React, { useRef, useState } from 'react';
import { Button, Space, message, Popconfirm, Switch, Tooltip, Input, Select, DatePicker } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

interface OutsourcingPlan {
  id: number;
  planCode: string;
  demandCode: string;
  productName: string;
  vendorName: string;
  planQuantity: number;
  completedQuantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate: string;
  status: number;
  remark: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const OutsourcingPlanManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [searchParams, setSearchParams] = useState<{
    planCode?: string;
    demandCode?: string;
    vendorName?: string;
    status?: number;
    deliveryDate?: string;
  }>({});

  const columns: ProColumns<OutsourcingPlan>[] = [
    {
      title: '计划编号',
      dataIndex: 'planCode',
      copyable: true,
      ellipsis: true,
      tip: '计划编号是唯一的',
    },
    {
      title: '需求编号',
      dataIndex: 'demandCode',
      ellipsis: true,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      ellipsis: true,
    },
    {
      title: '委外商',
      dataIndex: 'vendorName',
      ellipsis: true,
    },
    {
      title: '计划数量',
      dataIndex: 'planQuantity',
      sorter: true,
      search: false,
    },
    {
      title: '已完成数量',
      dataIndex: 'completedQuantity',
      sorter: true,
      search: false,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      valueType: 'money',
      search: false,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      valueType: 'money',
      search: false,
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      valueType: 'date',
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '草稿', status: 'Default' },
        2: { text: '已确认', status: 'Processing' },
        3: { text: '执行中', status: 'Processing' },
        4: { text: '已完成', status: 'Success' },
        5: { text: '已取消', status: 'Error' },
      },
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} />
          </Tooltip>
          <Popconfirm
            title="确定要删除该委外计划吗？"
            onConfirm={async () => {
              try {
                // await deleteOutsourcingPlan(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (apiError: any) {
                message.error(apiError.response?.data?.message || apiError.message || '删除失败');
              }
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
    <ProTable<OutsourcingPlan>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      headerTitle={
        <Space>
          <Input.Search
            placeholder="计划编号"
            onSearch={(value) => {
              setSearchParams(prev => ({ ...prev, planCode: value }));
              actionRef.current?.reload();
            }}
            style={{ width: 200 }}
            allowClear
          />
          <Input.Search
            placeholder="需求编号"
            onSearch={(value) => {
              setSearchParams(prev => ({ ...prev, demandCode: value }));
              actionRef.current?.reload();
            }}
            style={{ width: 200 }}
            allowClear
          />
          <Input.Search
            placeholder="委外商"
            onSearch={(value) => {
              setSearchParams(prev => ({ ...prev, vendorName: value }));
              actionRef.current?.reload();
            }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 200 }}
            allowClear
            options={[
              { label: '草稿', value: 1 },
              { label: '已确认', value: 2 },
              { label: '执行中', value: 3 },
              { label: '已完成', value: 4 },
              { label: '已取消', value: 5 },
            ]}
            onChange={(value) => {
              setSearchParams(prev => ({ ...prev, status: value }));
              actionRef.current?.reload();
            }}
          />
          <DatePicker
            placeholder="交付日期"
            style={{ width: 200 }}
            onChange={(date) => {
              setSearchParams(prev => ({
                ...prev,
                deliveryDate: date?.format('YYYY-MM-DD'),
              }));
              actionRef.current?.reload();
            }}
            allowClear
          />
        </Space>
      }
      request={async (params = {}, sort, filter) => {
        try {
          // 构建查询参数
          const queryParams = {
            ...params,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };

          // TODO: 实现获取委外计划列表的接口调用
          return {
            data: [],
            success: true,
            total: 0,
          };
        } catch (apiError: any) {
          message.error(apiError.response?.data?.message || apiError.message || '获取数据失败');
          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      search={false}
      editable={{
        type: 'multiple',
      }}
      columnsState={{
        persistenceKey: 'execution-outsourcing-plan-table',
        persistenceType: 'localStorage',
      }}
      rowKey="id"
      options={{
        density: false,
        fullScreen: true,
        reload: true,
        setting: {
          listsHeight: 400,
        },
      }}
      pagination={{
        pageSize: 10,
        onChange: (page) => console.log(page),
      }}
      dateFormatter="string"
      toolBarRender={() => [
        <Button type="primary" key="primary" onClick={() => {}}>
          <PlusOutlined /> 新建计划
        </Button>,
      ]}
    />
  );
};

export default OutsourcingPlanManagement; 