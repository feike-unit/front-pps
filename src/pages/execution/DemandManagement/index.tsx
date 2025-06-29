import React, { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Tooltip,
  Table,
  Form,
  Input,
  DatePicker,
  Select,
  Card,
  Row,
  Col,
  Divider,
  InputNumber,
  Modal,
  Radio,
  Badge,
  Typography,
  Alert
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { TableComponents } from 'rc-table/lib/interface';
import { 
  ProTable,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDatePicker,
  ProFormTreeSelect,
  ProDescriptions,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined, CaretDownOutlined, CheckOutlined, StopOutlined, PlayCircleOutlined, SyncOutlined, SwapOutlined, MinusCircleOutlined, ScheduleOutlined, EyeOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { 
  Demand, 
  DemandStatus, 
  createDemand, 
  updateDemand, 
  getDemandPage, 
  DemandPageRequest,
  deleteDemand,
  updateDemandStatus,
  syncDemands,
  DateQuantity,
  InsertOrderRequest,
  submitInsertOrder,
  getDemandById,
  schedulerDemands
} from '../../../services/demand';
import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import { RadioChangeEvent } from 'antd/lib/radio';
import { useNavigate } from 'react-router-dom';
import './index.less';

// 定义状态颜色映射
const statusColorMap: Record<number, string> = {
  [-1]: 'rgba(250, 173, 20, 0.15)',  // 未排产 - 橙色
  [DemandStatus.INCOMPLETE]: 'rgba(24, 144, 255, 0.15)', // 未完成 - 蓝色
  [DemandStatus.COMPLETED]: 'rgba(82, 196, 26, 0.15)',   // 已完成 - 绿色
};

const DemandManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<{
    productId?: number;
    status?: DemandStatus;
    deliveryDateStart?: string;
    deliveryDateEnd?: string;
    keyword?: string;
  }>({});
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
  const [form] = Form.useForm();
  
  // 插单相关状态
  const [insertOrderModalVisible, setInsertOrderModalVisible] = useState<boolean>(false);
  const [currentDemand, setCurrentDemand] = useState<Demand | null>(null);
  const [dateQuantityList, setDateQuantityList] = useState<DateQuantity[]>([]);
  const [insertOrderForm] = Form.useForm();
  const [rePlanScope, setRePlanScope] = useState<number>(0);

  const navigate = useNavigate();
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<Demand | null>(null);

  const [selectedRows, setSelectedRows] = useState<Demand[]>([]);
  const [batchPlanModalVisible, setBatchPlanModalVisible] = useState<boolean>(false);
  const [batchPlanForm] = Form.useForm();
  const [singlePlanModalVisible, setSinglePlanModalVisible] = useState<boolean>(false);
  const [currentPlanDemand, setCurrentPlanDemand] = useState<Demand | null>(null);
  const [planForm] = Form.useForm();

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
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

  // 处理关键字搜索
  const handleKeywordSearch = debounce((value: string) => {
    setSearchParams(prev => ({
      ...prev,
      keyword: value || undefined
    }));
    actionRef.current?.reload();
  }, 500);

  // 初始加载默认选项
  useEffect(() => {
    handleProductSearch('');
  }, []);

  // 计算剩余可插单数量
  const calculateRemainingQuantity = () => {
    const totalPlannedQuantity = dateQuantityList.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const remainingQuantity = (currentDemand?.purgeQuantity || 0) - (currentDemand?.completionQuantity || 0) - totalPlannedQuantity;
    return Math.max(0, remainingQuantity);
  };

  // 获取最后一个日期
  const getLastDate = () => {
    if (dateQuantityList.length === 0) {
      return dayjs();
    }
    const lastDate = dateQuantityList[dateQuantityList.length - 1].insertOrderDate;
    return dayjs(lastDate);
  };

  // 检查日期是否重复
  const isDateDuplicate = (date: string, excludeIndex?: number) => {
    return dateQuantityList.some((item, index) => 
      index !== excludeIndex && item.insertOrderDate === date
    );
  };

  // 处理打开插单对话框
  const handleOpenInsertOrderModal = async (record: Demand) => {
    try {
      // 先设置当前选中的需求数据
      setCurrentDemand(record);
      
      // 初始化第一条日期数量记录，数量为生产数量-完工数量
      const initialQuantity = (record.purgeQuantity || 0) - (record.completionQuantity || 0);
      const initialDateQuantity: DateQuantity = {
        insertOrderDate: dayjs().format('YYYY-MM-DD'),
        quantity: initialQuantity,
      };
      setDateQuantityList([initialDateQuantity]);
      
      // 重置表单
      insertOrderForm.resetFields();
      // 确保重置后设置默认值
      setTimeout(() => {
        insertOrderForm.setFieldsValue({
          rePlanScope: 0
        });
      }, 0);
      
      // 显示对话框
      setInsertOrderModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取需求详情失败');
    }
  };

  // 处理关闭插单对话框
  const handleCloseInsertOrderModal = () => {
    // 清空表单和状态
    insertOrderForm.resetFields();
    setDateQuantityList([]);
    setCurrentDemand(null);
    setInsertOrderModalVisible(false);
  };

  // 处理添加日期数量
  const handleAddDateQuantity = () => {
    const remainingQuantity = calculateRemainingQuantity();
    if (remainingQuantity <= 0) {
      message.warning('已无剩余可插单数量');
      return;
    }

    // 获取最后一个日期并加1天
    const nextDate = getLastDate().add(1, 'day').format('YYYY-MM-DD');

    setDateQuantityList([
      ...dateQuantityList,
      {
        insertOrderDate: nextDate,
        quantity: remainingQuantity,
      },
    ]);
  };

  // 处理移除日期数量
  const handleRemoveDateQuantity = (index: number) => {
    const newList = [...dateQuantityList];
    newList.splice(index, 1);
    setDateQuantityList(newList);
  };

  // 处理日期变更
  const handleDateChange = (index: number, date: dayjs.Dayjs | null) => {
    if (!date) return;
    
    const newDate = date.format('YYYY-MM-DD');
    
    // 检查日期是否重复
    if (isDateDuplicate(newDate, index)) {
      message.error('该日期已存在，请选择其他日期');
      return;
    }

    const newList = [...dateQuantityList];
    newList[index].insertOrderDate = newDate;
    setDateQuantityList(newList);
  };

  // 处理数量变更
  const handleQuantityChange = (index: number, value: number | null) => {
    if (value === null) return;

    const newList = [...dateQuantityList];
    const oldQuantity = newList[index].quantity || 0;
    const remainingQuantity = calculateRemainingQuantity() + oldQuantity; // 加回当前行的旧数量

    // 确保新数量不超过剩余可用数量
    const newQuantity = Math.min(value, remainingQuantity);
    if (value > remainingQuantity) {
      message.warning('输入数量超过剩余可插单数量');
    }

    newList[index].quantity = newQuantity;
    setDateQuantityList(newList);
  };

  // 处理影响范围变更
  const handleRePlanScopeChange = (e: RadioChangeEvent) => {
    const value = e.target.value;
    setRePlanScope(value);
  };

  // 处理提交插单计划
  const handleSubmitInsertOrder = async (values: any) => {
    try {
      if (!currentDemand?.id) {
        message.error('未选择需求');
        return false;
      }
      
      // 构建插单请求数据
      const insertOrderData: InsertOrderRequest = {
        demandId: currentDemand.id,
        dateQuantityList: dateQuantityList,
        rePlanScope: values.rePlanScope || 0,
      };
      
      // 提交插单请求
      await submitInsertOrder(insertOrderData);
      
      // 关闭对话框并刷新表格
      message.success('插单计划提交成功');
      handleCloseInsertOrderModal();
      actionRef.current?.reload();
      
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '插单计划提交失败');
      return false;
    }
  };

  // 切换到日历视图
  const handleSwitchToCalendar = () => {
    console.log('跳转到日历视图:', '/execution/demands/calendar');
    navigate('/execution/demands/calendar');
  };

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
      title: '货品编号/名称',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      width: 250,
      render: (_, record) => (
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {`${record.productCode} - ${record.productName}`}
        </div>
      ),
    },
    {
      title: '货品类型',
      dataIndex: 'productType',
      valueType: 'select',
      valueEnum: {
        1: { text: '采购件' },
        2: { text: '自制件' },
        3: { text: '委外件' },
      },
      width: 100,
    },
    {
      title: '订单数量',
      dataIndex: 'demandQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '生产数量',
      dataIndex: 'purgeQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '已计划数量',
      dataIndex: 'planQuantity',
      sorter: true,
      width: 100,
      hideInTable: true,
    },
    {
      title: '变更前数量',
      dataIndex: 'changePurgeQuantity',
      sorter: true,
      width: 100,
      hideInTable: true,
    },
    {
      title: '关闭净需数量',
      dataIndex: 'closePurgeQuantity',
      sorter: true,
      width: 100,
      hideInTable: true,
    },
    {
      title: '报工数量',
      dataIndex: 'registeredQuantity',
      sorter: true,
      width: 100,
      hideInTable: true,
    },
    {
      title: '完工数量',
      dataIndex: 'completionQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '交期',
      dataIndex: 'deliveryDate',
      valueType: 'date',
      sorter: true,
      defaultSortOrder: 'descend',
      width: 120,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      valueType: 'date',
      sorter: true,
      width: 120,
      hideInTable: true,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      valueType: 'date',
      sorter: true,
      width: 120,
      hideInTable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        [-1]: { text: '未排产', status: 'warning' },
        [0]: { text: '未完成', status: 'processing' },
        [1]: { text: '已完成', status: 'success' },
      },
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
      hideInTable: true,
      render: (_, record) => {
        const changeStatus = record.changeStatus;
        let color = '#000';
        let text = '未变更';
        
        switch (changeStatus) {
          case -1:
            color = '#ff4d4f';
            text = '已删除';
            break;
          case 0:
            color = '#000';
            text = '未变更';
            break;
          case 1:
            color = '#faad14';
            text = '已减少';
            break;
          case 2:
            color = '#1890ff';
            text = '已增加';
            break;
          default:
            color = '#000';
            text = '未变更';
        }
        
        return (
          <Badge color={color} text={text} />
        );
      },
    },
    {
      title: '业务标识',
      dataIndex: 'businessKey',
      ellipsis: true,
      width: 120,
      hidden: true,
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      ellipsis: true,
      width: 120,
      hideInTable: true,
    },
    {
      title: '业务单号',
      dataIndex: 'businessDocNo',
      ellipsis: true,
      width: 150,
    },
    {
      title: '客户订单号',
      dataIndex: 'customerOrderDocNo',
      ellipsis: true,
      width: 150,
    },
    {
      title: 'BOM ID',
      dataIndex: 'bomId',
      ellipsis: true,
      width: 200,
      hideInTable: true,
    },
    {
      title: '父BOM ID',
      dataIndex: 'parentBomId',
      ellipsis: true,
      width: 200,
      hideInTable: true,
    },
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      ellipsis: true,
      width: 120,
      hideInTable: true,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      ellipsis: true,
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
      width: 150,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          {/* 添加排产按钮 */}
          {record.status === -1 && (
            <Tooltip title="排产">
              <a onClick={() => handleSinglePlan(record)}>
                <PlayCircleOutlined style={{ color: '#1890ff' }} />
              </a>
            </Tooltip>
          )}
          {/* 查看详情按钮 */}
          <Tooltip title="查看详情">
            <a onClick={() => handleViewDetails(record)}>
              <EyeOutlined style={{ color: '#1890ff' }} />
            </a>
          </Tooltip>
          {/* 插单按钮 */}
          <Tooltip title="插单">
            <a onClick={() => handleOpenInsertOrderModal(record)}>
              <SwapOutlined style={{ color: '#1890ff' }} />
            </a>
          </Tooltip>
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

  // 处理批量排产
  const handleBatchPlan = async () => {
    try {
      const values = await batchPlanForm.validateFields();
      const demandIds = selectedRows.map(row => row.id!);
      // 转换日期格式为后端期望的格式
      const schedulerOrderDateTime = dayjs(values.schedulerOrderDateTime).format('YYYY-MM-DD HH:mm:ss');
      await schedulerDemands(demandIds, schedulerOrderDateTime);
      message.success('批量排产成功');
      setBatchPlanModalVisible(false);
      actionRef.current?.reload();
      setSelectedRows([]);
      batchPlanForm.resetFields();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '批量排产失败');
    }
  };

  // 处理单个排产
  const handleSinglePlan = async (record: Demand) => {
    setCurrentPlanDemand(record);
    setSinglePlanModalVisible(true);
  };

  // 处理单个排产提交
  const handleSinglePlanSubmit = async () => {
    try {
      const values = await planForm.validateFields();
      // 转换日期格式为后端期望的格式
      const schedulerOrderDateTime = dayjs(values.schedulerOrderDateTime).format('YYYY-MM-DD HH:mm:ss');
      await schedulerDemands([currentPlanDemand!.id!], schedulerOrderDateTime);
      message.success('排产成功');
      setSinglePlanModalVisible(false);
      actionRef.current?.reload();
      planForm.resetFields();
      setCurrentPlanDemand(null);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '排产失败');
    }
  };

  return (
    <>
      <ProTable<Demand>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        bordered
        defaultSize="small"
        scroll={{ x: 1500 }}
        components={components}
        onRow={(record) => {
          const completionQuantity = record.completionQuantity || 0;
          const purgeQuantity = record.purgeQuantity || 0;
          
          // 计算进度，已完成状态显示100%进度
          let progress = 0;
          if (record.status === DemandStatus.COMPLETED) {
            // 已完成状态显示满进度
            progress = 100;
          } else {
            // 未完成状态根据完成率计算
            progress = purgeQuantity > 0 ? (completionQuantity / purgeQuantity) * 100 : 0;
          }
          
          // 使用状态颜色映射获取背景色
          const bgColor = statusColorMap[record.status] || statusColorMap[DemandStatus.INCOMPLETE];
          
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
            <Select
              placeholder="货品编号/名称"
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
              placeholder={['开始交期', '结束交期']}
              style={{ width: 250 }}
              onChange={(dates) => {
                // 只有当两个日期都选择了，才设置日期区间参数
                if (dates && dates[0] && dates[1]) {
                  const startDate = dates[0]?.format('YYYY-MM-DD');
                  const endDate = dates[1]?.format('YYYY-MM-DD');
                  
                  if (startDate && endDate) {
                    setSearchParams(prev => ({
                      ...prev,
                      deliveryDateStart: startDate,
                      deliveryDateEnd: endDate,
                      deliveryDate: undefined
                    }));
                  }
                } else {
                  // 如果没有选择完整的日期区间，则清空所有日期参数
                  setSearchParams(prev => ({
                    ...prev,
                    deliveryDateStart: undefined,
                    deliveryDateEnd: undefined,
                    deliveryDate: undefined
                  }));
                }
                actionRef.current?.reload();
              }}
              allowClear
            />
            <Select
              placeholder="状态"
              style={{ width: 150 }}
              allowClear
              options={[
                { label: '未完成', value: DemandStatus.INCOMPLETE },
                { label: '已完成', value: DemandStatus.COMPLETED },
              ]}
              onChange={(value) => {
                setSearchParams(prev => ({ ...prev, status: value }));
                actionRef.current?.reload();
              }}
            />
            <Input
              placeholder="业务单号/客户订单号/客户编号/名称"
              style={{ width: 300 }}
              onChange={(e) => handleKeywordSearch(e.target.value)}
              allowClear
              onPressEnter={(e) => handleKeywordSearch((e.target as HTMLInputElement).value)}
              onClear={() => handleKeywordSearch('')}
            />
          </Space>
        }
        request={async (params = {}, sort, filter) => {
          try {
            const { current, pageSize, ...restParams } = params;
            
            // 如果没有排序参数，则使用默认的交期倒序排序
            const sortParams = Object.keys(sort || {}).length > 0 
              ? { 
                  sortField: Object.keys(sort)[0],
                  sortOrder: Object.values(sort)[0] === 'ascend' ? 'asc' : 'desc'
                }
              : { 
                  sortField: 'deliveryDate',
                  sortOrder: 'desc' 
                };
            
            const pageParams: DemandPageRequest = {
              pageNum: current || 1,
              pageSize: pageSize || 10,
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
          defaultPageSize: 10,
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
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
          getCheckboxProps: (record) => ({
            disabled: record.status !== -1, // 只允许选择未排产的记录
          }),
        }}
        tableAlertRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
          <Space size={24}>
            <Alert
              message={
                <Space>
                  已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
                  <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
                    取消选择
                  </a>
                </Space>
              }
              type="info"
              showIcon
            />
          </Space>
        )}
        tableAlertOptionRender={() => {
          return (
            <Space size={16}>
              <Button
                type="primary"
                onClick={() => {
                  setBatchPlanModalVisible(true);
                }}
              >
                批量排产
              </Button>
            </Space>
          );
        }}
        toolBarRender={() => [
          <Button
            key="calendar"
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={handleSwitchToCalendar}
            style={{ marginRight: 8 }}
          >
            日历视图
          </Button>,
          <Popconfirm
            key="syncConfirm"
            title="确定要同步需求数据吗？"
            onConfirm={async () => {
              try {
                await syncDemands();
                message.success('需求同步成功');
                actionRef.current?.reload();
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '需求同步失败');
              }
            }}
          >
            <Button
              key="sync"
              type="primary"
              icon={<SyncOutlined />}
            >
              同步需求
            </Button>
          </Popconfirm>
        ]}
      />
      <Modal
        title="插单计划"
        width={800}
        open={insertOrderModalVisible}
        onCancel={handleCloseInsertOrderModal}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {currentDemand && (
          <Form form={insertOrderForm} onFinish={handleSubmitInsertOrder} layout="vertical">
            <Card bordered={false} style={{ marginBottom: 0 }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>货品编号/名称</div>
                    <div>{`${currentDemand.productCode || ''} ${currentDemand.productName ? '- ' + currentDemand.productName : ''}`}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>生产数量</div>
                    <div>{currentDemand.purgeQuantity || 0}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>完工数量</div>
                    <div>{currentDemand.completionQuantity || 0}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>交期</div>
                    <div>{currentDemand.deliveryDate || '-'}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>开始日期</div>
                    <div>{currentDemand.startDate || '-'}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 0 }}>
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>结束日期</div>
                    <div>{currentDemand.endDate || '-'}</div>
                  </div>
                </Col>
              </Row>
            </Card>
            
            <Card bordered={false} style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>
                <Button 
                  type="dashed" 
                  onClick={handleAddDateQuantity} 
                  block 
                  icon={<PlusOutlined />}
                  disabled={calculateRemainingQuantity() <= 0}
                >
                  添加插单日期
                </Button>
              </div>
              
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1, marginRight: 16 }}>插单日期</div>
                  <div style={{ flex: 1, marginRight: 16 }}>插单数量</div>
                  <div style={{ width: 32 }}></div>
                </div>
              </div>
              
              {dateQuantityList.map((item, index) => (
                <div key={index} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <DatePicker
                      style={{ width: '100%' }}
                      value={item.insertOrderDate ? dayjs(item.insertOrderDate) : null}
                      onChange={(date) => handleDateChange(index, date)}
                      format="YYYY-MM-DD"
                      placeholder="选择插单日期"
                      allowClear={false}
                      showToday
                    />
                  </div>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={currentDemand!.demandQuantity}
                      value={item.quantity}
                      onChange={(value) => handleQuantityChange(index, value as number)}
                    />
                  </div>
                  <div>
                    {dateQuantityList.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => handleRemoveDateQuantity(index)}
                      />
                    )}
                  </div>
                </div>
              ))}
              
              <Divider style={{ margin: '24px 0 16px' }} />
              
              <Form.Item name="rePlanScope" label="影响范围" initialValue={0}>
                <Radio.Group defaultValue={0} onChange={handleRePlanScopeChange}>
                  <Space direction="vertical">
                    <Tooltip title="仅插单不影响其他计划，保持其他计划不变">
                      <Radio value={0}>仅插单不影响其他计划</Radio>
                    </Tooltip>
                    <Tooltip title="插单后，需要重新计算其插入日期之后的产能而影响到的其他计划">
                      <Radio value={1}>插单并重新计算影响的其他计划</Radio>
                    </Tooltip>
                  </Space>
                </Radio.Group>
              </Form.Item>
              
              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button onClick={handleCloseInsertOrderModal} style={{ marginRight: 8 }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  提交插单计划
                </Button>
              </div>
            </Card>
          </Form>
        )}
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
                    <div className="label">关闭净需数量</div>
                    <div className="value">{detailRecord.closePurgeQuantity || 0}</div>
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
                    <div className="label">交期</div>
                    <div className="value">{detailRecord.deliveryDate}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="detail-item">
                    <div className="label">开始日期</div>
                    <div className="value">{detailRecord.startDate || '-'}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="detail-item">
                    <div className="label">结束日期</div>
                    <div className="value">{detailRecord.endDate || '-'}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="detail-item">
                    <div className="label">状态</div>
                    <div className="value">
                      <Badge 
                        color={
                          detailRecord.status === -1 ? '#faad14' :
                          detailRecord.status === 0 ? '#1890ff' :
                          detailRecord.status === 1 ? '#52c41a' : '#000'
                        } 
                        text={
                          detailRecord.status === -1 ? '未排产' :
                          detailRecord.status === 0 ? '未完成' :
                          detailRecord.status === 1 ? '已完成' : '-'
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
                    <div className="label">业务类型</div>
                    <div className="value">{detailRecord.businessType}</div>
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
                    <div className="label">客户名称</div>
                    <div className="value">{detailRecord.customerName}</div>
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
                      title: '订单数量',
                      dataIndex: 'demandQuantity',
                      key: 'demandQuantity',
                      width: 100,
                    },
                    {
                      title: '生产数量',
                      dataIndex: 'purgeQuantity',
                      key: 'purgeQuantity',
                      width: 100,
                    },
                    {
                      title: '已计划数量',
                      dataIndex: 'planQuantity',
                      key: 'planQuantity',
                      width: 100,
                    },
                    {
                      title: '报工数量',
                      dataIndex: 'registeredQuantity',
                      key: 'registeredQuantity',
                      width: 100,
                    },
                    {
                      title: '完工数量',
                      dataIndex: 'completionQuantity',
                      key: 'completionQuantity',
                      width: 100,
                    },
                    {
                      title: '交期',
                      dataIndex: 'deliveryDate',
                      key: 'deliveryDate',
                      width: 120,
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 100,
                      render: (status) => (
                        <Badge
                          color={
                            status === -1 ? '#faad14' :
                            status === 0 ? '#1890ff' :
                            status === 1 ? '#52c41a' : '#000'
                          }
                          text={
                            status === -1 ? '未排产' :
                            status === 0 ? '未完成' :
                            status === 1 ? '已完成' : '-'
                          }
                        />
                      ),
                    },
                    {
                      title: '变更状态',
                      dataIndex: 'changeStatus',
                      key: 'changeStatus',
                      width: 100,
                      render: (changeStatus) => (
                        <Badge
                          color={
                            changeStatus === -1 ? '#ff4d4f' :
                            changeStatus === 0 ? '#000' :
                            changeStatus === 1 ? '#faad14' :
                            changeStatus === 2 ? '#1890ff' : '#000'
                          }
                          text={
                            changeStatus === -1 ? '已删除' :
                            changeStatus === 0 ? '未变更' :
                            changeStatus === 1 ? '已减少' :
                            changeStatus === 2 ? '已增加' : '未变更'
                          }
                        />
                      ),
                    },
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

      {/* 批量排产对话框 */}
      <Modal
        title="批量排产"
        open={batchPlanModalVisible}
        onCancel={() => {
          setBatchPlanModalVisible(false);
          batchPlanForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setBatchPlanModalVisible(false);
            batchPlanForm.resetFields();
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleBatchPlan}
          >
            确认排产
          </Button>
        ]}
        width={800}
      >
        <Alert
          message={`已选择 ${selectedRows.length} 个未排产需求进行批量排产`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <div style={{ marginBottom: 24 }}>
          <Typography.Text type="warning">
            注意：系统将自动为选中的需求进行排产计划安排。
          </Typography.Text>
        </div>

        <Form form={batchPlanForm} layout="vertical">
          <Form.Item
            name="schedulerOrderDateTime"
            label="排产开始时间"
            rules={[{ required: true, message: '请选择排产开始时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="请选择排产开始时间"
            />
          </Form.Item>
        </Form>

        {/* 显示选中的需求列表 */}
        <Table
          dataSource={selectedRows}
          columns={[
            {
              title: '货品编号/名称',
              dataIndex: 'productCode',
              render: (_, record) => `${record.productCode} - ${record.productName}`,
            },
            {
              title: '订单数量',
              dataIndex: 'demandQuantity',
            },
            {
              title: '交期',
              dataIndex: 'deliveryDate',
            }
          ]}
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
          expandable={{
            showExpandColumn: false
          }}
          rowKey="id"
        />
      </Modal>

      {/* 单个排产对话框 */}
      <Modal
        title="排产计划"
        open={singlePlanModalVisible}
        onCancel={() => {
          setSinglePlanModalVisible(false);
          planForm.resetFields();
          setCurrentPlanDemand(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setSinglePlanModalVisible(false);
            planForm.resetFields();
            setCurrentPlanDemand(null);
          }}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSinglePlanSubmit}
          >
            确认排产
          </Button>
        ]}
      >
        {currentPlanDemand && (
          <>
            <Alert
              message={`正在为货品"${currentPlanDemand.productCode} - ${currentPlanDemand.productName}"进行排产`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={planForm} layout="vertical">
              <Form.Item
                name="schedulerOrderDateTime"
                label="排产开始时间"
                rules={[{ required: true, message: '请选择排产开始时间' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder="请选择排产开始时间"
                />
              </Form.Item>
            </Form>

            <div style={{ marginTop: 16 }}>
              <Typography.Text type="warning">
                注意：系统将根据选择的开始时间自动安排排产计划。
              </Typography.Text>
            </div>
          </>
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
