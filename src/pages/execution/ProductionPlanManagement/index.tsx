import React, { useRef, useState } from 'react';
import { Button, Space, message, Popconfirm, Switch, Tooltip, Input, Select, DatePicker } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import {
  ProductionPlan,
  ProductionPlanStatus,
  ProductionPlanPageRequest,
  getProductionPlanPage,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  updateProductionPlanStatus,
} from '../../../services/productionPlan';
import { searchLines } from '../../../services/line';
import debounce from 'lodash/debounce';

const ProductionPlanManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [searchParams, setSearchParams] = useState<{
    planCode?: string;
    demandCode?: string;
    lineCode?: string;
    status?: number;
    startDate?: string;
    endDate?: string;
  }>({});
  const [searchLineOptions, setSearchLineOptions] = useState<{ label: string; value: string }[]>([]);

  // 处理拉线搜索
  const handleLineSearch = debounce(async (value: string) => {
    try {
      const lines = await searchLines(value || '');
      const options = lines.map(line => ({
        label: `${line.lineCode} - ${line.lineName}`,
        value: line.lineCode
      }));
      setSearchLineOptions(options);
    } catch (error: any) {
      message.error('搜索拉线失败');
    }
  }, 500);

  // 初始加载默认选项
  React.useEffect(() => {
    handleLineSearch('');
  }, []);

  const columns: ProColumns<ProductionPlan>[] = [
    {
      title: '计划编号',
      dataIndex: 'planCode',
      copyable: true,
      ellipsis: true,
      tip: '计划编号是唯一的',
      sorter: true,
    },
    {
      title: '需求编号',
      dataIndex: 'demandCode',
      ellipsis: true,
      sorter: true,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      ellipsis: true,
      sorter: true,
    },
    {
      title: '拉线',
      dataIndex: 'lineCode',
      ellipsis: true,
      sorter: true,
      render: (_, record) => `${record.lineCode} - ${record.lineName}`,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        placeholder: '请输入拉线编号或名称搜索',
        defaultActiveFirstOption: false,
        filterOption: false,
        onSearch: handleLineSearch,
        options: searchLineOptions,
        notFoundContent: null,
        allowClear: true,
        onClick: () => handleLineSearch(''),
      },
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
      title: '开始日期',
      dataIndex: 'startDate',
      valueType: 'date',
      sorter: true,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      valueType: 'date',
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [ProductionPlanStatus.DRAFT]: { text: '草稿', status: 'Default' },
        [ProductionPlanStatus.CONFIRMED]: { text: '已确认', status: 'Processing' },
        [ProductionPlanStatus.EXECUTING]: { text: '执行中', status: 'Processing' },
        [ProductionPlanStatus.COMPLETED]: { text: '已完成', status: 'Success' },
        [ProductionPlanStatus.CANCELLED]: { text: '已取消', status: 'Error' },
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
            title="确定要删除该生产计划吗？"
            onConfirm={async () => {
              try {
                await deleteProductionPlan(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error) {
                const apiError = error as ApiError;
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
    <ProTable<ProductionPlan>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      bordered
      defaultSize="small"
      request={async (params = {}, sort, filter) => {
        try {
          const { current, pageSize, ...restParams } = params;
          
          // 构建请求参数
          const requestParams: ProductionPlanPageRequest = {
            pageNum: current || 1,
            pageSize: pageSize || 10,
            ...restParams,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };

          const result = await getProductionPlanPage(requestParams);

          return {
            data: result.list,
            success: true,
            total: result.total,
          };
        } catch (error) {
          const apiError = error as ApiError;
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
        persistenceKey: 'execution-production-plan-table',
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
          <Select
            placeholder="拉线编号/名称"
            style={{ width: 200 }}
            showSearch
            allowClear
            defaultActiveFirstOption={false}
            filterOption={false}
            onSearch={handleLineSearch}
            onChange={(value: string) => {
              setSearchParams(prev => ({ ...prev, lineCode: value }));
              actionRef.current?.reload();
            }}
            options={searchLineOptions}
            onClick={() => handleLineSearch('')}
          />
          <Select
            placeholder="状态"
            style={{ width: 200 }}
            allowClear
            options={[
              { label: '草稿', value: ProductionPlanStatus.DRAFT },
              { label: '已确认', value: ProductionPlanStatus.CONFIRMED },
              { label: '执行中', value: ProductionPlanStatus.EXECUTING },
              { label: '已完成', value: ProductionPlanStatus.COMPLETED },
              { label: '已取消', value: ProductionPlanStatus.CANCELLED },
            ]}
            onChange={(value) => {
              setSearchParams(prev => ({ ...prev, status: value }));
              actionRef.current?.reload();
            }}
          />
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 300 }}
            onChange={(dates) => {
              setSearchParams(prev => ({
                ...prev,
                startDate: dates?.[0]?.format('YYYY-MM-DD'),
                endDate: dates?.[1]?.format('YYYY-MM-DD'),
              }));
              actionRef.current?.reload();
            }}
            allowClear
          />
        </Space>
      }
      pagination={{
        defaultPageSize: 10,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
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

export default ProductionPlanManagement; 