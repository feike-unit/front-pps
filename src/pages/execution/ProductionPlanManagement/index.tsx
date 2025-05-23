import React, { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Space, message, Tooltip, Select, DatePicker, Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { TableComponents } from 'rc-table/lib/interface';
import { ProTable, ProDescriptions } from '@ant-design/pro-components';
import { EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';


// 引入计划运行时任务相关服务
import {
  PlanRuntime,
  ProductType,
  getPlanRuntimePage,
  getPlanRuntimeById,
  PlanRuntimePageRequest
} from '../../../services/planRuntime';

import {
  ProductionPlanStatus,
} from '../../../services/productionPlan';

import { searchLines } from '../../../services/line';
import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';

const ProductionPlanManagement: React.FC = () => {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>();
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
  const [searchLineOptions, setSearchLineOptions] = useState<{ label: string; value: number }[]>([]);
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<PlanRuntime | null>(null);
  
  // 跳转到日历视图
  const handleSwitchToCalendar = () => {
    navigate('/execution/production-calendar');
  };
  
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
        value: line.id!
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

  const columns: ProColumns<PlanRuntime>[] = [
    {
      title: '批次号',
      dataIndex: 'batchCode',
      copyable: true,
      ellipsis: true,
      tip: '批次号是唯一的',
      sorter: true,
      width: 120,
      hidden: true,
    },
    {
      title: '需求ID',
      dataIndex: 'demandId',
      ellipsis: true,
      sorter: true,
      width: 100,
      hidden: true,
    },
    {
      title: '货品编号/名称',
      dataIndex: 'productCode',
      ellipsis: true,
      sorter: true,
      width: 200,
      render: (_, record) => record.productCode ? `${record.productCode} - ${record.productName}` : record.productName,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        placeholder: '请输入货品编号或名称搜索',
        defaultActiveFirstOption: false,
        filterOption: false,
        onSearch: handleProductSearch,
        options: searchProductOptions,
        notFoundContent: null,
        allowClear: true,
        onClick: () => handleProductSearch(''),
      },
    },
    {
      title: '拉线编号/名称',
      dataIndex: 'lineName',
      ellipsis: true,
      sorter: true,
      valueType: 'select',
      width: 200,
      render: (_, record) => record.lineCode ? `${record.lineCode} - ${record.lineName}` : record.lineName,
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
        1: { text: '采购件' },
        2: { text: '自制件' },
        3: { text: '委外件' },
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
      width: 60,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <a onClick={() => handleViewDetails(record)}><EyeOutlined style={{ color: '#1890ff' }} /></a>
          </Tooltip>
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
        onRow={(record) => {
          const completionQuantity = record.completionQuantity || 0;
          const taskQuantity = record.taskQuantity || 0;
          const progress = taskQuantity > 0 ? (completionQuantity / taskQuantity) * 100 : 0;
          
          // 使用状态颜色映射获取背景色 (如果没有taskStatus，则使用默认颜色)
          // 根据任务是否完成选择颜色：完成则使用绿色，否则使用蓝色
          const bgColor = completionQuantity >= taskQuantity 
            ? 'rgba(82, 196, 26, 0.15)' // 完成时使用绿色
            : 'rgba(24, 144, 255, 0.15)'; // 未完成时使用蓝色
          
          return {
            style: {
              position: 'relative',
              backgroundImage: `linear-gradient(to right, ${bgColor} ${progress}%, transparent ${progress}%)`,
              backgroundPosition: 'bottom',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 10px',
            },
          };
        }}
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
        toolBarRender={() => [
          <Button
            key="calendar"
            type="primary"
            icon={<CalendarOutlined />}
            onClick={handleSwitchToCalendar}
          >
            日历视图
          </Button>
        ]}
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
              onChange={(value: number) => {
                setSearchParams(prev => ({ ...prev, lineId: value }));
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
                  startAt: dates?.[0]?.format('YYYY-MM-DD'),
                  endAt: dates?.[1]?.format('YYYY-MM-DD'),
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

      {/* 详情对话框 */}
      <Modal
        title="生产计划详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {detailRecord && (
          <ProDescriptions<PlanRuntime>
            column={2}
            title={false}
            dataSource={detailRecord}
            columns={[
              {
                title: '批次号',
                dataIndex: 'batchCode',
              },
              {
                title: '货品编号/名称',
                dataIndex: 'productCode',
                render: (_, record) => record.productCode ? `${record.productCode} - ${record.productName}` : record.productName,
              },
              {
                title: '拉线',
                dataIndex: 'lineName',
                render: (_, record) => record.lineCode ? `${record.lineCode} - ${record.lineName}` : record.lineName,
              },
              {
                title: '货品类型',
                dataIndex: 'productType',
                valueEnum: {
                  1: { text: '采购件' },
                  2: { text: '自制件' },
                  3: { text: '委外件' },
                },
              },
              {
                title: '任务数量',
                dataIndex: 'taskQuantity',
              },
              {
                title: '登记数量',
                dataIndex: 'registeredQuantity',
              },
              {
                title: '完成数量',
                dataIndex: 'completionQuantity',
              },
              {
                title: '开始日期',
                dataIndex: 'startAt',
                render: (_, record) => record.startAt ? record.startAt.substring(0, 10) : '-',
              },
              {
                title: '结束日期',
                dataIndex: 'endAt',
                render: (_, record) => record.endAt ? record.endAt.substring(0, 10) : '-',
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
              },
            ]}
          />
        )}
      </Modal>
    </>
  );
};

export default ProductionPlanManagement; 