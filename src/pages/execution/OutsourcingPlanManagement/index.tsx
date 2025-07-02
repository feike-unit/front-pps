import React, { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Space, message, Tooltip, Select, DatePicker, Modal } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { TableComponents } from 'rc-table/lib/interface';
import { ProTable, ProDescriptions } from '@ant-design/pro-components';
import { EyeOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';

// 引入计划运行时任务相关服务
import {
  PlanRuntime,
  ProductType,
  getPlanRuntimePage,
  getPlanRuntimeById,
  PlanRuntimePageRequest
} from '../../../services/planRuntime';

import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';

const OutsourcingPlanManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [searchParams, setSearchParams] = useState<{
    planCode?: string;
    demandCode?: string;
    productId?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
    productType?: number;
    batchCode?: string;
    demandId?: number;
    startAtBegin?: string;
    endAtBegin?: string;
  }>({
    // 默认只显示委外件类型
    productType: ProductType.OUTSOURCED,
  });
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
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

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
      // 只搜索委外件类型的货品
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
      title: '业务类型',
      dataIndex: 'businessType',
      ellipsis: true,
      sorter: true,
      width: 120,
    },
    {
      title: '业务单号',
      dataIndex: 'businessDocNo',
      ellipsis: true,
      sorter: true,
      copyable: true,
      width: 150,
    },
    {
      title: '客户订单号',
      dataIndex: 'customerOrderDocNo',
      ellipsis: true,
      sorter: true,
      copyable: true,
      width: 150,
    },
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      ellipsis: true,
      sorter: true,
      width: 120,
      hideInTable: true,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      ellipsis: true,
      sorter: true,
      width: 180,
    },
    {
      title: '任务数量',
      dataIndex: 'taskQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '点收数量',
      dataIndex: 'registeredQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '入库数量',
      dataIndex: 'completionQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '下单时间',
      dataIndex: 'startAt',
      valueType: 'dateTime',
      sorter: true,
      width: 120,
      render: (_, record) => record.startAt ? record.startAt.substring(0, 16) : '-',
    },
    {
      title: '到货时间',
      dataIndex: 'endAt',
      valueType: 'date',
      sorter: true,
      width: 120,
      render: (_, record) => record.endAt ? record.endAt.substring(0, 16) : '-',
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
          
          // 根据任务进度设置行背景颜色
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
              // 固定只查询委外件类型
              productType: ProductType.OUTSOURCED,
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
        headerTitle={
          <Space>
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
          defaultPageSize: 20,
          showQuickJumper: true,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        dateFormatter="string"
      />

      {/* 详情对话框 */}
      <Modal
        title="委外计划详情"
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
                copyable: true,
              },
              {
                title: '需求ID',
                dataIndex: 'demandId',
              },
              {
                title: '货品编号',
                dataIndex: 'productCode',
              },
              {
                title: '货品名称',
                dataIndex: 'productName',
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
                title: '业务类型',
                dataIndex: 'businessType',
              },
              {
                title: '业务单号',
                dataIndex: 'businessDocNo',
                copyable: true,
              },
              {
                title: '客户订单号',
                dataIndex: 'customerOrderDocNo',
                copyable: true,
              },
              {
                title: '客户编号',
                dataIndex: 'customerCode',
              },
              {
                title: '客户名称',
                dataIndex: 'customerName',
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

export default OutsourcingPlanManagement; 