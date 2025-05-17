import React, { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button, Space, message, Popconfirm, Switch, Tooltip, Input, Select, DatePicker, Modal, Form } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { TableComponents } from 'rc-table/lib/interface';
import { ProTable, ModalForm, ProForm, ProFormText, ProFormDigit, ProFormSelect, ProFormDatePicker } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

// 引入计划运行时任务相关服务
import {
  PlanRuntime,
  TaskStatus,
  ProductType,
  getPlanRuntimePage,
  createPlanRuntime, 
  updatePlanRuntime,
  deletePlanRuntime,
  updatePlanRuntimeStatus,
  getPlanRuntimeById,
  PlanRuntimePageRequest,
  PlanRuntimeUpdate
} from '../../../services/planRuntime';

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
import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';

const ProductionPlanManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    planCode?: string;
    demandCode?: string;
    lineCode?: string;
    productId?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
    productType?: number;
    batchCode?: string;
    demandId?: number;
    taskStatus?: number;
    startAtBegin?: string;
    endAtBegin?: string;
  }>({
    // 默认只显示自制件类型
    productType: ProductType.SELF_MADE,
  });
  const [searchLineOptions, setSearchLineOptions] = useState<{ label: string; value: string }[]>([]);
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<PlanRuntime | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<PlanRuntime | null>(null);
  
  // 定义表格列头单元格的通用样式
  const components: TableComponents<PlanRuntime> = {
    header: {
      cell: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
        <th
          {...props}
          style={{
            ...props.style,
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}
        />
      ),
    },
  };

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

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
      // 只搜索自制件类型的货品
      const products = await searchProducts(value || '');
      const options = products.map(product => ({
        label: `${product.productCode} - ${product.productName}`,
        value: product.id!
      }));
      setSearchProductOptions(options);
    } catch (error: any) {
      message.error('搜索货品失败');
    }
  }, 500);

  // 初始加载默认选项
  useEffect(() => {
    handleLineSearch('');
    handleProductSearch('');
  }, []);

  // 处理查看详情
  const handleViewDetails = async (record: PlanRuntime) => {
    try {
      const detailData = await getPlanRuntimeById(record.id);
      setDetailRecord(detailData);
      setDetailModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取详情失败');
    }
  };

  // 处理编辑
  const handleEdit = (record: PlanRuntime) => {
    setCurrentRecord(record);
    form.setFieldsValue({
      batchCode: record.batchCode,
      taskQuantity: record.taskQuantity,
      registeredQuantity: record.registeredQuantity,
      completionQuantity: record.completionQuantity,
      startAt: record.startAt ? record.startAt.substring(0, 10) : undefined,
      endAt: record.endAt ? record.endAt.substring(0, 10) : undefined,
      taskStatus: record.taskStatus
    });
    setEditModalVisible(true);
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      if (!currentRecord?.id) return;

      const updateData: PlanRuntimeUpdate = {
        batchCode: values.batchCode,
        taskQuantity: values.taskQuantity,
        registeredQuantity: values.registeredQuantity,
        completionQuantity: values.completionQuantity,
        taskStatus: values.taskStatus,
        startAt: values.startAt,
        endAt: values.endAt
      };

      await updatePlanRuntime(currentRecord.id, updateData);
      message.success('更新成功');
      setEditModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '更新失败');
    }
  };

  const columns: ProColumns<PlanRuntime>[] = [
    {
      title: '批次号',
      dataIndex: 'batchCode',
      copyable: true,
      ellipsis: true,
      tip: '批次号是唯一的',
      sorter: true,
      width: 120,
    },
    {
      title: '需求ID',
      dataIndex: 'demandId',
      ellipsis: true,
      sorter: true,
      width: 100,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      ellipsis: true,
      sorter: true,
      width: 150,
    },
    {
      title: '拉线',
      dataIndex: 'lineName',
      ellipsis: true,
      sorter: true,
      valueType: 'select',
      width: 120,
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
      title: '货品类型',
      dataIndex: 'productType',
      valueType: 'select',
      width: 100,
      valueEnum: {
        [ProductType.SELF_MADE]: { text: '自制件', status: 'Processing' },
      },
    },
    {
      title: '任务数量',
      dataIndex: 'taskQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '登记数量',
      dataIndex: 'registeredQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '完成数量',
      dataIndex: 'completionQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '开始日期',
      dataIndex: 'startAt',
      valueType: 'date',
      sorter: true,
      width: 120,
      render: (_, record) => record.startAt ? record.startAt.substring(0, 10) : '-',
    },
    {
      title: '结束日期',
      dataIndex: 'endAt',
      valueType: 'date',
      sorter: true,
      width: 120,
      render: (_, record) => record.endAt ? record.endAt.substring(0, 10) : '-',
    },

    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      search: false,
      width: 150,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <a onClick={() => handleViewDetails(record)}><EyeOutlined style={{ color: '#1890ff' }} /></a>
          </Tooltip>
          <Tooltip title="编辑">
            <a onClick={() => handleEdit(record)}><EditOutlined style={{ color: '#1890ff' }} /></a>
          </Tooltip>
          <Popconfirm
            title="确定要删除该生产任务吗？"
            onConfirm={async () => {
              try {
                await deletePlanRuntime(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '删除失败');
              }
            }}
          >
            <Tooltip title="删除">
              <a><DeleteOutlined style={{ color: '#ff4d4f' }} /></a>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<PlanRuntime>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        bordered
        defaultSize="small"
        scroll={{ x: 1500 }}
        components={components}
        request={async (params = {}, sort, filter) => {
          try {
            const { current, pageSize, ...restParams } = params;
            
            // 构建请求参数
            const requestParams: PlanRuntimePageRequest = {
              pageNum: current || 1,
              pageSize: pageSize || 10,
              ...restParams,
              ...searchParams,
              // 固定只查询自制件类型
              productType: ProductType.SELF_MADE,
              sortField: Object.keys(sort || {})[0],
              sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
            };

            const result = await getPlanRuntimePage(requestParams);

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
            <Select
              placeholder="拉线"
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
              placeholder="货品"
              style={{ width: 200 }}
              showSearch
              allowClear
              defaultActiveFirstOption={false}
              filterOption={false}
              onSearch={handleProductSearch}
              onChange={(value: number) => {
                setSearchParams(prev => ({ ...prev, productId: value }));
                actionRef.current?.reload();
              }}
              options={searchProductOptions}
              onClick={() => handleProductSearch('')}
            />

            <DatePicker.RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 300 }}
              onChange={(dates) => {
                setSearchParams(prev => ({
                  ...prev,
                  startAtBegin: dates?.[0]?.format('YYYY-MM-DD'),
                  endAtBegin: dates?.[1]?.format('YYYY-MM-DD'),
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
      />
    </>
  );
};

export default ProductionPlanManagement; 