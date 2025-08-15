import React, { useRef, useState, useEffect } from 'react';
import {Space, message, Tooltip, DatePicker, Modal, Input, Button} from 'antd';
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

import debounce from 'lodash/debounce';
import dayjs from "dayjs";

const PurchasePlanManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [searchParams, setSearchParams] = useState<{
    productId?: number;
    status?: number;
    productType?: number;
    startAt?: string;
    endAt?: string;
    productKeyword?: string;
    keyword?: string;
  }>(() => {
    // 从 localStorage 中恢复查询条件，如果没有则使用默认值
    const saved = localStorage.getItem('purchasePlanManagementSearchParams');
    console.log("purchasePlanManagementSearchParams:" + saved);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { productType: ProductType.PURCHASE };
      }
    }
    return { productType: ProductType.PURCHASE };
  });

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

  // 添加 useEffect 来保存查询条件到 localStorage
  useEffect(() => {
    localStorage.setItem('purchasePlanManagementSearchParams', JSON.stringify(searchParams));
  }, [searchParams]);

  // 处理产品关键字搜索
  const handleProductKeywordSearch = debounce((value: string) => {
    setSearchParams(prev => ({
      ...prev,
      productKeyword: value || undefined
    }));
    actionRef.current?.reload();
  }, 500);

  // 处理关键字搜索
  const handleKeywordSearch = debounce((value: string) => {
    setSearchParams(prev => ({
      ...prev,
      keyword: value || undefined
    }));
    actionRef.current?.reload();
  }, 500);

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

  // 在组件卸载时保存查询条件
  useEffect(() => {
    return () => {
      // 组件卸载时保存当前查询条件
      localStorage.setItem('purchasePlanManagementSearchParams', JSON.stringify(searchParams));
    };
  }, [searchParams]);

  const columns: ProColumns<PlanRuntime>[] = [
    {
      title: '需求ID',
      dataIndex: 'demandId',
      ellipsis: true,
      sorter: true,
      width: 100,
      hidden: true,
    },
    {
      title: '货品编号',
      dataIndex: 'productCode',
      ellipsis: true,
      copyable: true,
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'productName',
      ellipsis: true,
      width: 200
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
      title: '业务单号',
      dataIndex: 'businessDocNo',
      ellipsis: true,
      copyable: true,
      width: 150,
    },
    {
      title: '客户订单号',
      dataIndex: 'customerOrderDocNo',
      ellipsis: true,
      copyable: true,
      width: 150,
    },
    {
      title: '客户',
      dataIndex: 'customerCode',
      ellipsis: true,
      copyable: true,
      width: 180,
    },
    {
      title: '订单数量',
      dataIndex: 'demandQuantity',
      width: 100,
    },
    {
      title: '任务数量',
      dataIndex: 'taskQuantity',
      width: 100,
    },
    {
      title: '点收数量',
      dataIndex: 'registeredQuantity',
      width: 100,
    },
    {
      title: '入库数量',
      dataIndex: 'completionQuantity',
      width: 100,
    },
    {
      title: '到货时间',
      dataIndex: 'onlineTime',
      valueType: 'date',
      sorter: true,
      width: 130,
      render: (_, record) => record.onlineTime ? record.onlineTime.substring(0, 16) : '-',
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
        request={async (params = {}, sort) => {
          try {
            const { current, pageSize, ...restParams } = params;
            
            // 构建请求参数
            const requestParams: PlanRuntimePageRequest = {
              pageNum: current || 1,
              pageSize: pageSize || 100,
              ...restParams,
              ...searchParams,
              // 固定只查询采购件类型
              productType: ProductType.PURCHASE,
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
          persistenceKey: 'execution-purchase-plan-table',
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
            <Input
                placeholder="产品编码/产品名称"
                style={{width: 160}}
                value={ searchParams.productKeyword || undefined }
                allowClear
                onPressEnter={(e) => handleProductKeywordSearch((e.target as HTMLInputElement).value)}
                onClear={() => handleProductKeywordSearch('')}
            />
            <DatePicker.RangePicker
                placeholder={['到货开始日期', '到货结束日期']}
                value={[
                  searchParams.startAt ? dayjs(searchParams.startAt) : undefined,
                  searchParams.endAt ? dayjs(searchParams.endAt) : undefined
                ]}
                style={{ width: 220 }}
                onChange={(dates) => {
                  // 只有当两个日期都选择了，才设置日期区间参数
                  if (dates && dates[0] && dates[1]) {
                    const startDate = dates[0]?.format('YYYY-MM-DD');
                    const endDate = dates[1]?.format('YYYY-MM-DD');

                    if (startDate && endDate) {
                      setSearchParams(prev => ({
                        ...prev,
                        startAt: startDate,
                        endAt: endDate
                      }));
                    }
                  } else {
                    // 如果没有选择完整的日期区间，则清空所有日期参数
                    setSearchParams(prev => ({
                      ...prev,
                      startAt: undefined,
                      endAt: undefined
                    }));
                  }
                  actionRef.current?.reload();
                }}
                allowClear
            />
            <Input
                placeholder="业务单号/客户订单号/客户编号/名称"
                style={{width: 200}}
                value={ searchParams.keyword || undefined }
                allowClear
                onPressEnter={(e) => handleKeywordSearch((e.target as HTMLInputElement).value)}
                onClear={() => handleKeywordSearch('')}
            />
          </Space>
        }
        pagination={{
          defaultPageSize: 100,
          showQuickJumper: true,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        dateFormatter="string"
        toolBarRender={() => [
          <Button
              key="clearFilters"
              onClick={() => {
                // 清除所有查询条件
                localStorage.removeItem('productionPlanManagementSearchParams');
                setSearchParams({ productType: ProductType.PURCHASE });
                // 清除表单中的输入值
                if (actionRef.current) {
                  actionRef.current.reload();
                }
              }}
          >
            清除条件
          </Button>
        ]}
      />

      {/* 详情对话框 */}
      <Modal
        title="采购计划详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {detailRecord && (
          <ProDescriptions<PlanRuntime>
            column={2}
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
                title: '客户',
                dataIndex: 'customerCode',
              },
              {
                title: '订单数量',
                dataIndex: 'demandQuantity',
              },
              {
                title: '任务数量',
                dataIndex: 'taskQuantity',
              },
              {
                title: '点收数量',
                dataIndex: 'registeredQuantity',
              },
              {
                title: '入库数量',
                dataIndex: 'completionQuantity',
              },
              {
                title: '到货时间',
                dataIndex: 'endAt',
                render: (_, record) => record.onlineTime ? record.onlineTime.substring(0, 16) : '-',
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

export default PurchasePlanManagement; 