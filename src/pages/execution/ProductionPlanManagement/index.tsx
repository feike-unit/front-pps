import React, { useRef, useState, useEffect } from 'react';
import {
  Button,
  Space,
  message,
  Tooltip,
  Table,
  Form,
  Input,
  DatePicker,
  Select,
  Card,
  Row,
  Col,
  InputNumber,
  Modal,
  Badge,
  Typography,
  Alert,
  Spin,
  Popconfirm,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { TableComponents } from 'rc-table/lib/interface';
import {
  ProTable
} from '@ant-design/pro-components';
import { CaretRightOutlined, CaretDownOutlined, SyncOutlined, SwapOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import {
  Demand,
  DemandStatus,
  getDemandPage,
  DemandPageRequest,
  getScheduledDemands,
  getDemandById,
  insertOrderDemands,
  callbackDeliveryTime,
  syncCallbackQty,
  revokeDemandsByBusinessKeyAndRePlanScope
} from '../../../services/demand';
import debounce from 'lodash/debounce';
import './index.less';
import { getAllEnabledLines } from '../../../services/line';
import { ProductionPlanPageRequest } from "../../../services/productionPlan";
import api from "../../../services/api";
import dayjs from 'dayjs';
import {ProductType} from "../../../services/planRuntime.ts";

// 定义状态颜色映射
const statusColorMap: Record<number, string> = {
  [-1]: 'rgba(250, 173, 20, 0.15)',  // 未排产 - 橙色
  [DemandStatus.INCOMPLETE]: 'rgba(24, 144, 255, 0.15)', // 未完成 - 蓝色
  [DemandStatus.COMPLETED]: 'rgba(82, 196, 26, 0.15)',   // 已完成 - 绿色
};

const DemandManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);

  const [searchParams, setSearchParams] = useState<{
    productId?: number;
    lineId?: number;
    completionStatus?: number;  // 0: 未完成, 1: 已完成
    status?: number; // 0: 未排产 1已排产
    planDateStart?: string;
    planDateEnd?: string;
    productType?: number;
    keyword?: string;
    productKeyword?: string;
    deliveryStatus?: string;
    materialStatus?: string;
    planMonth?: string; // 添加月份查询参数
  }>(() => {
    // 从 localStorage 中恢复查询条件，如果没有则使用默认值
    const saved = localStorage.getItem('productionPlanManagementSearchParams');
    console.log("productionPlanManagementSearchParams:" + saved);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          status: 1, // 默认只显示待排产的需求
          productType: ProductType.SELF_MADE,
          planMonth: dayjs().format('YYYY-MM') // 默认为当前月份
        };
      }
    }
    return {
      status: 1, // 默认只显示待排产的需求
      productType: ProductType.SELF_MADE,
      planMonth: dayjs().format('YYYY-MM') // 默认为当前月份
    };
  });

  // 状态切换
  const [status] = useState<0 | 1>(1);

  const [singlePlanSearchValue, setSinglePlanSearchValue] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<Demand | null>(null);

  const [currentPlanDemand, setCurrentPlanDemand] = useState<Demand | null>(null);

  // 插单相关状态
  const [insertOrderModalVisible, setInsertOrderModalVisible] = useState<boolean>(false);
  const [insertOrderLoading, setInsertOrderLoading] = useState<boolean>(false);
  const [insertOrderForm] = Form.useForm();

  // 已排产需求列表
  const [scheduledDemands, setScheduledDemands] = useState<Demand[]>([]);
  const [loadingScheduledDemands] = useState<boolean>(false);

  // 批量排产需求排序列表
  const [lines, setLines] =  useState<{ label: string; value: number }[]>([]);

  // 获取所有启用的生产线
  const fetchLines = async () => {
    try {
      const lines = await getAllEnabledLines();
      const options = lines.map(line => ({
        label: `${line.lineName}(${line.lineCode})`,
        value: line.id!
      }));
      setLines(options);
    } catch (error) {
      message.error('获取生产线列表失败');
    }
  };

  useEffect(() => {
    fetchLines();
  }, []);

  const handleExportScheduledData = async () => {
    const EXPORT_PAGE_SIZE = 10000; // 导出最大条数

    try {
      message.loading('正在导出数据...', 60); // 设置最长加载时间 60s

      // 构建导出参数
      const exportParams: ProductionPlanPageRequest = {
        pageNum: 1,
        pageSize: EXPORT_PAGE_SIZE,
        ...searchParams
      };

      // 通过 axios 的方式直接调用 API，以便获取 headers
      const response = await api.get('/execution/demands/export/excel', {
        params: exportParams,
        responseType: 'blob',
        timeout: 60000 * 5 // 设置超时时间为5分钟
      });

      // 从响应头中获取文件名
      let filename = generateExportFilename();

      // 创建下载链接
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.destroy();
      message.success('导出成功');
    } catch (error) {
      message.destroy();
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 生成导出文件名
  function generateExportFilename(): string {
    const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    return `已排产订单_${dateStr}.xlsx`;
  }

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

  // 处理打开插单对话框
  const handleOpenInsertOrderModal = async (record: Demand) => {
    setCurrentPlanDemand(record);
    setInsertOrderModalVisible(true);
  };

  // 处理插单提交
  const handleInsertOrderSubmit = async () => {
    try {
      setInsertOrderLoading(true);
      const values = await insertOrderForm.validateFields();
      await insertOrderDemands(
          {
            demandIds: [currentPlanDemand!.id!],
            lineId: values.lineId,
            coefficient: values.coefficient,
            beforeDemandId: values.beforeDemandId,
            planMonth: values.planMonth
          }
      );
      message.success('插单成功');
      setInsertOrderModalVisible(false);
      actionRef.current?.reload();
      insertOrderForm.resetFields();
      setCurrentPlanDemand(null);
      setScheduledDemands([]); // 清空已排产需求列表
    } catch (error: any) {
      const apiError = error as ApiError;
      if (error.code === 'ECONNABORTED') {
        message.error('插单请求超时，请稍后重试');
      } else {
        message.error(apiError.response?.data?.message || apiError.message || '插单失败');
      }
    } finally {
      setInsertOrderLoading(false);
    }
  };

  // 在组件卸载时保存查询条件
  useEffect(() => {
    return () => {
      // 组件卸载时保存当前查询条件
      localStorage.setItem('productionPlanManagementSearchParams', JSON.stringify(searchParams));
    };
  }, [searchParams]);

  // 定义表格列头单元格的通用样式
  const components: TableComponents<Demand> = {
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

  // ProTable 列定义
  const columns: ProColumns<Demand>[] = [
    {
      title: '拉线',
      dataIndex: 'lineCode',
      render: (_, record) => `${record.lineCode} - ${record.lineName}`,
      ellipsis: true,
      width: 120
    },
    {
      title: '排产顺序',
      dataIndex: 'sortNo',
      ellipsis: true,
      sorter: true,
      width: 60
    },
    {
      title: '业务单号',
      dataIndex: 'businessDocNo',
      ellipsis: true,
      copyable: true,
      width: 160,
    },
    {
      title: '客户订单号',
      dataIndex: 'customerOrderDocNo',
      ellipsis: true,
      copyable: true,
      width: 120,
    },
    {
      title: '客户',
      dataIndex: 'customerCode',
      ellipsis: true,
      copyable: true,
      width: 100,
    },
    {
      title: '客户交期',
      dataIndex: 'deliveryDate',
      valueType: 'date',
      sorter: true,
      width: 100,
    },
    {
      title: '货品编码',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      width: 100,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      ellipsis: true,
      width: 240,
    },
    {
      title: '属性',
      dataIndex: 'productType',
      valueType: 'select',
      valueEnum: {
        1: { text: '采购件' },
        2: { text: '自制件' },
        3: { text: '委外件' },
      },
      width: 60,
    },
    {
      title: '订单数',
      dataIndex: 'demandQuantity',
      width: 60,
    },
    {
      title: '生产数',
      dataIndex: 'purgeQuantity',
      width: 60,
    },
    {
      title: '下达数',
      dataIndex: 'issuedQuantity',
      width: 60,
    },
    {
      title: '报工数',
      dataIndex: 'registeredQuantity',
      width: 60,
    },
    {
      title: '完工数',
      dataIndex: 'completionQuantity',
      width: 60,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
      width: 150,
    },
    {
      title: '完工状态',
      dataIndex: 'completionStatus',
      filters: false,
      onFilter: false,
      valueType: 'select',
      valueEnum: {
        [0]: { text: '未完工', status: 'warning' },
        [1]: { text: '已完工', status: 'processing' }
      },
      width: 100,
    },
    {
      title: '上线时间',
      dataIndex: 'onlineTime',
      valueType: 'dateTime',
      sorter: true,
      width: 140,
      render: (_, record) => record.onlineTime ? record.onlineTime.substring(0, 16) : '-',
    },
    {
      title: '完工时间',
      dataIndex: 'completionTime',
      valueType: 'dateTime',
      sorter: true,
      width: 140,
      render: (_, record) => record.completionTime ? record.completionTime.substring(0, 16) : '-',
    },
    {
      title: '物料状态',
      dataIndex: 'materialStatus',
      width: 120,
      hideInTable: status === 0,
      render: (_, record) => `${record.materialStatus} (${record.totalCompletionCount} / ${record.totalProductCount})`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
      width: 150,
    },
    {
      title: '变更前数量',
      dataIndex: 'changePurgeQuantity',
      width: 100,
    },
    {
      title: '变更状态',
      dataIndex: 'changeStatus',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        [-1]: { text: '已删除', status: 'error' },
        [0]: { text: '未变更', status: 'default' },
        [1]: { text: '已减少', status: 'warning' },
        [2]: { text: '已增加', status: 'processing' },
      },
      width: 100,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
          <Space size="middle">
            {/* 查看详情按钮 */}
            <Tooltip title="查看详情">
              <a onClick={() => handleViewDetails(record)}>
                <EyeOutlined style={{ color: '#1890ff' }} />
              </a>
            </Tooltip>
            {/* 插单按钮 - 只对未完成的需求显示 */}
            {record.completionStatus === 0 && (
                <Tooltip title="插单">
                  <a onClick={() => handleOpenInsertOrderModal(record)}>
                    <SwapOutlined style={{ color: '#1890ff' }} />
                  </a>
                </Tooltip>
            )}
            {/* 删除按钮 - 只对待排产需求显示 */}
            {record.status === 1 && (
                <Popconfirm
                    title="确定要撤回当前排产需求吗？"
                    description=""
                    onConfirm={() => handleSingleRevoke(record)}
                    okText="确定"
                    cancelText="取消"
                >
                  <Tooltip title="撤回">
                    <a>
                      <RollbackOutlined style={{ color: '#ff4d4f' }} />
                    </a>
                  </Tooltip>
                </Popconfirm>
            )}
          </Space>
      ),
    },
  ];

  // 处理查看详情
  const handleViewDetails = async (record: Demand) => {
    try {
      const detailData = await getDemandById(record.id!);
      setDetailRecord(detailData);
      setDetailModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取需求详情失败');
    }
  };

  const handleSingleRevoke = async (currentPlanDemand: Demand) => {
    try {
      if (!currentPlanDemand?.businessKey) {
        message.error('该需求缺少业务标识，无法撤回');
        return;
      }
      await revokeDemandsByBusinessKeyAndRePlanScope(currentPlanDemand?.businessKey, 1);
      message.success('撤回成功');
      actionRef.current?.reload();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '撤回失败');
    }
  };

  // 加载已排产需求列表
  const loadScheduledDemands = debounce( async (lineId: number, planMonth?: string, keyword?: string) => {
    try {
        setScheduledDemands(await getScheduledDemands(lineId, planMonth, keyword));
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取已排产需求列表失败');
    } finally {
    }
  }, 200);

  return (
      <>
        <ProTable<Demand>
            columns={columns}
            actionRef={actionRef}
            cardBordered
            bordered
            defaultSize="small"
            scroll={{ x: 'max-content' }}
            components={components}
            onRow={(record) => {
              const completionQuantity = record.completionQuantity || 0;
              const purgeQuantity = record.purgeQuantity || 0;

              // 计算进度，已完成状态显示100%进度
              let progress = 0;
              if (record.completionStatus === DemandStatus.COMPLETED) {
                // 已完成状态显示满进度
                progress = 100;
              } else {
                // 未完成状态根据完成率计算
                progress = purgeQuantity > 0 ? (completionQuantity / purgeQuantity) * 100 : 0;
              }

              // 使用状态颜色映射获取背景色
              const bgColor = statusColorMap[record.completionStatus] || statusColorMap[DemandStatus.INCOMPLETE];

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
            headerTitle={
              <Space wrap>
                <DatePicker
                    picker="month"
                    placeholder="选择月份"
                    value={searchParams.planMonth ? dayjs(searchParams.planMonth) : undefined}
                    style={{ width: 100 }}
                    onChange={(date) => {
                      const planMonth = date ? date.format('YYYY-MM') : undefined;
                      setSearchParams(prev => ({
                        ...prev,
                        planMonth
                      }));
                      actionRef.current?.reload();
                    }}
                />
                <Input
                    placeholder="产品编码/产品名称"
                    value={ searchParams.productKeyword || undefined }
                    style={{ width: 140 }}
                    allowClear
                    onPressEnter={(e) => handleProductKeywordSearch((e.target as HTMLInputElement).value)}
                    onClear={() => handleProductKeywordSearch('')}
                />
                <Select
                    placeholder="选择拉线"
                    value={ searchParams.lineId || undefined }
                    style={{ width: 120 }}
                    showSearch
                    allowClear
                    defaultActiveFirstOption={false}
                    filterOption={true}
                    onChange={(value: number) => {
                      setSearchParams(prev => ({ ...prev, lineId: value }));
                      actionRef.current?.reload();
                    }}
                    options={lines}
                />
                <DatePicker.RangePicker
                    placeholder={['开始上线日期', '结束上线日期']}
                    value={[
                      searchParams.planDateStart ? dayjs(searchParams.planDateStart) : undefined,
                      searchParams.planDateEnd ? dayjs(searchParams.planDateEnd) : undefined
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
                            planDateStart: startDate,
                            planDateEnd: endDate
                          }));
                        }
                      } else {
                        // 如果没有选择完整的日期区间，则清空所有日期参数
                        setSearchParams(prev => ({
                          ...prev,
                          planDateStart: undefined,
                          planDateEnd: undefined
                        }));
                      }
                      actionRef.current?.reload();
                    }}
                    allowClear
                />
                <Input
                    placeholder="业务单号/客户订单号/客户编号/名称"
                    value={ searchParams.keyword || undefined }
                    style={{ width: 160 }}
                    allowClear
                    onPressEnter={(e) => handleKeywordSearch((e.target as HTMLInputElement).value)}
                    onClear={() => handleKeywordSearch('')}
                />
                <Select
                    placeholder="排产交期状态"
                    value={ searchParams.deliveryStatus }
                    style={{ width: 120 }}
                    allowClear
                    options={[
                      { label: '超客户交期订单', value: 'overdue' },
                      { label: '正常排产订单', value: 'normal' }
                    ]}
                    onChange={(value) => {
                      setSearchParams(prev => ({ ...prev, deliveryStatus: value }));
                      actionRef.current?.reload();
                    }}
                />
                <Select
                    placeholder="物料齐套状态"
                    value={ searchParams.materialStatus }
                      style={{ width: 120 }}
                    allowClear
                    options={[
                      { label: '未齐套', value: 'overdue' },
                      { label: '已齐套', value: 'normal' }
                    ]}
                    onChange={(value) => {
                      setSearchParams(prev => ({ ...prev, materialStatus: value }));
                      actionRef.current?.reload();
                    }}
                />
                <Select
                    placeholder="完工状态"
                    value={ searchParams.completionStatus }
                    style={{ width: 100 }}
                    allowClear
                    options={[
                      { label: '未完工', value: 0 },
                      { label: '已完工', value: 1 }
                    ]}
                    onChange={(value) => {
                      setSearchParams(prev => ({ ...prev, completionStatus: value }));
                      actionRef.current?.reload();
                    }}
                />
              </Space>
            }
            request={async (params = {}, sort) => {
              try {
                const { current, pageSize, ...restParams } = params;

                // 如果没有排序参数，则使用默认的交期倒序排序
                const sortParams = Object.keys(sort || {}).length > 0
                    ? {
                      sortField: Object.keys(sort)[0],
                      sortOrder: Object.values(sort)[0] === 'ascend' ? 'asc' : 'desc'
                    }
                    : {
                      sortField: 'sortNo',
                      sortOrder: 'asc'
                    };

                const pageParams: DemandPageRequest = {
                  pageNum: current || 1,
                  pageSize: pageSize || 100,
                  ...restParams,
                  ...searchParams,
                  ...sortParams
                };

                const result = await getDemandPage(pageParams);

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
            editable={{
              type: 'multiple',
            }}
            columnsState={{
              persistenceKey: 'execution-demand-table',
              persistenceType: 'localStorage',
            }}
            rowKey="id"
            search={false}
            options={{
              density: false,
              fullScreen: true,
              reload: true,
              setting: {
                listsHeight: 400,
              },
            }}
            pagination={{
              defaultPageSize: 100,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            dateFormatter="string"
            expandable={{
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
              expandIcon: ({ expanded, onExpand, record }) => {
                if (record.children && record.children.length > 0) {
                  return expanded ? (
                      <CaretDownOutlined onClick={e => onExpand(record, e)} />
                  ) : (
                      <CaretRightOutlined onClick={e => onExpand(record, e)} />
                  );
                }
                return null;
              },
            }}
            childrenColumnName="children"
            indentSize={24}
            toolBarRender={() => [
              <Button
                  key="clearFilters"
                  onClick={() => {
                    // 清除所有查询条件
                    localStorage.removeItem('productionPlanManagementSearchParams');
                    setSearchParams({
                      status: 1, // 默认只显示待排产的需求
                      productType: ProductType.SELF_MADE,
                      planMonth: dayjs().format('YYYY-MM'), // 默认为当前月份
                    });
                    // 清除表单中的输入值
                    if (actionRef.current) {
                      actionRef.current.reload();
                    }
                  }}
              >
                清除条件
              </Button>,
              <Button
                  key="syncCallbackQty"
                  onClick={() => {
                    // 创建日期选择器弹窗
                    let syncDate: string | undefined = dayjs().format('YYYY-MM-DD');
                    Modal.confirm({
                      title: '同步erp完工数信息',
                      content: (
                          <div style={{ marginTop: 16 }}>
                            <span style={{ color: '#ff4d4f' }}>* </span>
                            <span>选择同步日期：</span>
                            <DatePicker
                                defaultValue={dayjs()}
                                onChange={(date) => {
                                  syncDate = date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                }}
                            />
                          </div>
                      ),
                      onOk: async () => {
                        if (!syncDate) {
                          message.error('请选择同步日期');
                          return Promise.reject('请选择同步日期');
                        }

                        try {
                          await syncCallbackQty(syncDate);
                          message.success('同步成功');
                          actionRef.current?.reload();
                        } catch (error) {
                          const apiError = error as ApiError;
                          message.error(apiError.response?.data?.message || apiError.message || '同步失败');
                        }
                      }
                    });
                  }}
              >
                <SyncOutlined />
                同步完工数
              </Button>,
              <Button
                  key="callbackDeliveryTime"
                  onClick={() => {
                    // 创建日期选择器弹窗
                    let syncDate: string | undefined = dayjs().format('YYYY-MM-DD');
                    Modal.confirm({
                      title: '回写交期数据',
                      content: (
                          <div style={{ marginTop: 16 }}>
                            <span style={{ color: '#ff4d4f' }}>* </span>
                            <span>选择日期：</span>
                            <DatePicker
                                defaultValue={dayjs()}
                                onChange={(date) => {
                                  syncDate = date ? date.format('YYYY-MM-DD') : undefined;
                                }}
                            />
                          </div>
                      ),
                      onOk: async () => {
                        if (!syncDate) {
                          message.error('请选择回写交期的日期');
                          return Promise.reject('请选择回写交期的日期');
                        }

                        try {
                          await callbackDeliveryTime(syncDate);
                          message.success('回写交期数据成功');
                          actionRef.current?.reload();
                        } catch (error) {
                          const apiError = error as ApiError;
                          message.error(apiError.response?.data?.message || apiError.message || '回写交期数据失败');
                        }
                      }
                    });
                  }}
              >
                <SyncOutlined />
                回写交期数据
              </Button>,
              <Button
                  key="export"
                  onClick={handleExportScheduledData}
              >
                导出
              </Button>,
            ]}
        />

        <Modal
            title="插单计划"
            open={insertOrderModalVisible}
            onCancel={() => {
              if (!insertOrderLoading) {
                setInsertOrderModalVisible(false);
                insertOrderForm.resetFields();
                setCurrentPlanDemand(null);
                setScheduledDemands([]); // 清空已排产需求列表
              }
            }}
            maskClosable={!insertOrderLoading}
            closable={!insertOrderLoading}
            footer={[
              <Button
                  key="cancel"
                  disabled={insertOrderLoading}
                  onClick={() => {
                    setInsertOrderModalVisible(false);
                    insertOrderForm.resetFields();
                    setCurrentPlanDemand(null);
                    setScheduledDemands([]); // 清空已排产需求列表
                  }}
              >
                取消
              </Button>,
              <Button
                  key="submit"
                  type="primary"
                  loading={insertOrderLoading}
                  disabled={insertOrderLoading}
                  onClick={handleInsertOrderSubmit}
              >
                确认插单
              </Button>
            ]}
            width={600}
        >
          <Spin spinning={insertOrderLoading} tip="正在插单中...">
            {currentPlanDemand && (
                <>
                  <Alert
                      message={`正在为货品"${currentPlanDemand.productCode} - ${currentPlanDemand.productName}"进行插单`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 24 }}
                  />

                  <Form form={insertOrderForm} layout="vertical">
                    <Form.Item
                        name="lineId"
                        label="生产拉线"
                        rules={[
                          {
                            validator: async (_, value) => {
                              if (currentPlanDemand?.productType === 2 && !value) { // 2 表示自制件
                                throw new Error('自制件必须选择生产拉线');
                              }
                            },
                          }
                        ]}
                    >
                      <Select
                          placeholder={currentPlanDemand?.productType === 2 ? "自制件必须选择生产拉线" : "请选择生产拉线"}
                          style={{ width: '100%' }}
                          options={lines}
                          onChange={(value) => {
                            if (value) {
                              const planMonth = insertOrderForm.getFieldValue('planMonth');
                              const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                              loadScheduledDemands(value, planMonthStr);
                              insertOrderForm.setFieldValue('beforeDemandId', undefined);
                            } else {
                              setScheduledDemands([]);
                            }
                          }}
                      />
                    </Form.Item>
                    <Form.Item
                        name="planMonth"
                        label="插单月份"
                    >
                      <DatePicker
                          picker="month"
                          style={{ width: '100%' }}
                          placeholder="请选择插单月份"
                          format="YYYY-MM"
                          value={dayjs(0)}
                          onChange={(date) => {
                            const lineId = insertOrderForm.getFieldValue('lineId');
                            if (lineId) {
                              const planMonthStr = date ? dayjs(date).format('YYYY-MM') : undefined;
                              loadScheduledDemands(lineId, planMonthStr);
                              insertOrderForm.setFieldValue('beforeDemandId', undefined);
                            }
                          }}
                      />
                    </Form.Item>
                    <Form.Item
                        name="coefficient"
                        label="产能系数"
                        initialValue={1}
                        rules={[
                          { required: true, message: '请输入产能系数' },
                          { type: 'number', min: 0, message: '产能系数必须大于0' }
                        ]}
                    >
                      <InputNumber
                          style={{ width: '100%' }}
                          placeholder="请输入产能系数"
                          precision={2}
                          step={0.1}
                      />
                    </Form.Item>
                    <Form.Item
                        name="beforeDemandId"
                        label="插单位置"
                        extra="选择或输入搜索要排在哪个需求之前，不选择则排在最后"
                    >
                      <Select
                          placeholder="请选择或输入搜索要排在哪个需求之前"
                          style={{ width: '100%' }}
                          showSearch
                          options={scheduledDemands.map(demand => ({
                            label: `${demand.lineSortNo} ${demand.businessDocNo} ${demand.productName} ${demand.deliveryDate}`,
                            value: demand.id
                          }))}
                          disabled={!insertOrderForm.getFieldValue('lineId') || loadingScheduledDemands}
                          filterOption={false}
                          loading={loadingScheduledDemands}
                          allowClear
                          onInputKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const lineId = insertOrderForm.getFieldValue('lineId');
                              if (lineId) {
                                const planMonth = insertOrderForm.getFieldValue('planMonth');
                                const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                loadScheduledDemands(lineId, planMonthStr, singlePlanSearchValue);
                              }
                            }
                          }}
                          searchValue={singlePlanSearchValue}
                          onSearch={(value) => {
                            setSinglePlanSearchValue(value);
                          }}
                      />
                    </Form.Item>
                  </Form>
                </>
            )}
          </Spin>
        </Modal>

        {/* 需求详情对话框 */}
        <Modal
            title="需求单详情"
            open={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={null}
            width={1200}
        >
          {detailRecord && (
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 根需求信息表单 */}
                <Card title="基本信息" bordered={false} style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">货品编号</div>
                        <div className="value">
                          <Typography.Text copyable>{detailRecord.productCode}</Typography.Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">货品名称</div>
                        <div className="value">{detailRecord.productName}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">货品类型</div>
                        <div className="value">
                          {detailRecord.productType === 1 ? '采购件' :
                              detailRecord.productType === 2 ? '自制件' :
                                  detailRecord.productType === 3 ? '委外件' : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">订单数量</div>
                        <div className="value">{detailRecord.demandQuantity}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">生产/采购数量</div>
                        <div className="value">{detailRecord.purgeQuantity}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">已计划数量</div>
                        <div className="value">{detailRecord.planQuantity || 0}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">变更前数量</div>
                        <div className="value">{detailRecord.changePurgeQuantity || 0}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">下达数量</div>
                        <div className="value">{detailRecord.registeredQuantity}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">报工数量</div>
                        <div className="value">{detailRecord.registeredQuantity}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">完工数量</div>
                        <div className="value">{detailRecord.completionQuantity}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">上线时间</div>
                        <div className="value">{detailRecord.onlineTime || '-'}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">完工时间</div>
                        <div className="value">{detailRecord.completionTime || '-'}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">状态</div>
                        <div className="value">
                          <Badge
                              color={
                                    detailRecord.completionStatus === 0 ? '#1890ff' :
                                        detailRecord.completionStatus === 1 ? '#52c41a' : '#000'
                              }
                              text={
                                    detailRecord.completionStatus === 0 ? '未完工' :
                                        detailRecord.completionStatus === 1 ? '已完工' : '-'
                              }
                          />
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">变更状态</div>
                        <div className="value">
                          <Badge
                              color={
                                detailRecord.changeStatus === -1 ? '#ff4d4f' :
                                    detailRecord.changeStatus === 0 ? '#000' :
                                        detailRecord.changeStatus === 1 ? '#faad14' :
                                            detailRecord.changeStatus === 2 ? '#1890ff' : '#000'
                              }
                              text={
                                detailRecord.changeStatus === -1 ? '已删除' :
                                    detailRecord.changeStatus === 0 ? '未变更' :
                                        detailRecord.changeStatus === 1 ? '已减少' :
                                            detailRecord.changeStatus === 2 ? '已增加' : '未变更'
                              }
                          />
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">业务单号</div>
                        <div className="value">
                          <Typography.Text copyable>{detailRecord.businessDocNo}</Typography.Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">客户订单号</div>
                        <div className="value">
                          <Typography.Text copyable>{detailRecord.customerOrderDocNo}</Typography.Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">客户</div>
                        <div className="value">{detailRecord.customerCode}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="detail-item">
                        <div className="label">备注</div>
                        <div className="value">{detailRecord.remark || '-'}</div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* 子需求树形表格 */}
                {detailRecord.children && detailRecord.children.length > 0 && (
                    <Card title="子需求列表" bordered={false}>
                      <Table<Demand>
                          dataSource={detailRecord.children}
                          columns={[
                            {
                              title: '货品编号/名称',
                              dataIndex: 'productCode',
                              key: 'productCode',
                              render: (_, record) => `${record.productCode} - ${record.productName}`,
                            },
                            {
                              title: '货品类型',
                              dataIndex: 'productType',
                              key: 'productType',
                              width: 100,
                              render: (type) => {
                                switch (type) {
                                  case 1:
                                    return '采购件';
                                  case 2:
                                    return '自制件';
                                  case 3:
                                    return '委外件';
                                  default:
                                    return '-';
                                }
                              },
                            },
                            {
                              title: '数量',
                              dataIndex: 'purgeQuantity',
                              key: 'purgeQuantity',
                              width: 100,
                            },
                            {
                              title: '完成数量',
                              dataIndex: 'completionQuantity',
                              key: 'completionQuantity',
                              width: 100,
                            },
                            {
                              title: '客户交期',
                              dataIndex: 'deliveryDate',
                              key: 'deliveryDate',
                              width: 120,
                            }
                          ]}
                          size="small"
                          pagination={false}
                          rowKey="id"
                          expandable={{
                            defaultExpandAllRows: true,
                            expandIcon: ({ expanded, onExpand, record }) => {
                              if (record.children && record.children.length > 0) {
                                return expanded ? (
                                    <CaretDownOutlined onClick={e => onExpand(record, e)} />
                                ) : (
                                    <CaretRightOutlined onClick={e => onExpand(record, e)} />
                                );
                              }
                              return null;
                            },
                          }}
                      />
                    </Card>
                )}
              </div>
          )}
        </Modal>
        <style>{`
        .detail-item {
          .label {
            color: rgba(0, 0, 0, 0.45);
            font-size: 14px;
            margin-bottom: 4px;
          }
          .value {
            color: rgba(0, 0, 0, 0.85);
            font-size: 14px;
          }
        }
      `}</style>
      </>
  );
};

export default DemandManagement;
