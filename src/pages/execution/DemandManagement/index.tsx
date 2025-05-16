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
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined, CaretDownOutlined, CheckOutlined, StopOutlined, PlayCircleOutlined, SyncOutlined } from '@ant-design/icons';
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
  confirmAndExecuteDemand,
  syncDemands,
} from '../../../services/demand';
import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';
import { db } from '../../../utils/db';

// 定义表格唯一标识符
const TABLE_ID = 'demand_management';

// 定义状态颜色映射
const statusColorMap: Record<number, string> = {
  [1]: 'rgba(217, 217, 217, 0.15)', 
  [2]: 'rgba(24, 144, 255, 0.15)', 
  [3]: 'rgba(24, 144, 255, 0.15)', 
  [4]: 'rgba(82, 196, 26, 0.15)', 
  [5]: 'rgba(255, 77, 79, 0.15)', 
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
  // 添加选中行状态
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // 恢复选中行状态
  useEffect(() => {
    const loadSelectedRow = async () => {
      try {
        const savedRowId = await db.getTableSelectedRow(TABLE_ID);
        if (savedRowId) {
          setSelectedRowId(savedRowId);
        }
      } catch (error) {
        console.error('获取选中行状态失败', error);
      }
    };

    loadSelectedRow();
  }, []);

  // 处理行点击事件
  const handleRowClick = (record: Demand) => {
    if (record.id) {
      // 如果点击的是当前选中行，则取消选中
      if (selectedRowId === record.id) {
        setSelectedRowId(null);
        db.clearTableSelectedRow(TABLE_ID);
      } else {
        setSelectedRowId(record.id);
        db.saveTableSelectedRow(record.id, TABLE_ID);
      }
    }
  };

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

  // 初始加载默认选项
  useEffect(() => {
    handleProductSearch('');
  }, []);

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
      title: '货品编码',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      width: 120,
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
      title: '需求数量',
      dataIndex: 'demandQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '净需数量',
      dataIndex: 'purgeQuantity',
      sorter: true,
      width: 100,
    },
    {
      title: '报工数量',
      dataIndex: 'registeredQuantity',
      sorter: true,
      width: 100,
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
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        1: { text: '草稿', status: 'default' },
        2: { text: '已确认', status: 'processing' },
        3: { text: '执行中', status: 'processing' },
        4: { text: '已完成', status: 'success' },
        5: { text: '已取消', status: 'error' },
      },
      width: 100,
    },
    {
      title: '业务标识',
      dataIndex: 'businessKey',
      ellipsis: true,
      width: 120,
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      ellipsis: true,
      width: 120,
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
          {/* 草稿状态可以确认执行 */}
          {record.status === DemandStatus.DRAFT && (
            <Popconfirm
              title="确认执行该需求？"
              onConfirm={async () => {
                try {
                  await confirmAndExecuteDemand(record.id!);
                  message.success('确认执行成功');
                  actionRef.current?.reload();
                } catch (error) {
                  const apiError = error as ApiError;
                  message.error(apiError.response?.data?.message || apiError.message || '确认执行失败');
                }
              }}
            >
              <Tooltip title="确认执行">
                <a><PlayCircleOutlined style={{ color: '#1890ff' }} /></a>
              </Tooltip>
            </Popconfirm>
          )}
          
          {/* 已确认或执行中状态可以修改为已取消 */}
          {(record.status === DemandStatus.CONFIRMED || record.status === DemandStatus.EXECUTING) && (
            <Popconfirm
              title="确认将状态修改为已取消？"
              onConfirm={async () => {
                try {
                  await updateDemandStatus(record.id!, DemandStatus.CANCELLED);
                  message.success('状态修改成功');
                  actionRef.current?.reload();
                } catch (error) {
                  const apiError = error as ApiError;
                  message.error(apiError.response?.data?.message || apiError.message || '状态修改失败');
                }
              }}
            >
              <Tooltip title="修改为已取消">
                <a><StopOutlined style={{ color: '#ff4d4f' }} /></a>
              </Tooltip>
            </Popconfirm>
          )}
          
          {/* 只有草稿和已取消状态才可以删除 */}
          {(record.status === DemandStatus.DRAFT || record.status === DemandStatus.CANCELLED) && (
            <Popconfirm
              title="确定要删除该需求吗？"
              onConfirm={async () => {
                try {
                  await deleteDemand(record.id!);
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
          )}
        </Space>
      ),
    },
  ];

  return (
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
        const progress = purgeQuantity > 0 ? (completionQuantity / purgeQuantity) * 100 : 0;
        
        // 使用状态颜色映射获取背景色
        const bgColor = statusColorMap[record.status] || statusColorMap[DemandStatus.DRAFT];
        
        // 判断当前行是否被选中
        const isSelected = record.id === selectedRowId;
        
        return {
          onClick: () => handleRowClick(record),
          style: {
            position: 'relative',
            backgroundImage: `linear-gradient(to right, ${bgColor} ${progress}%, transparent ${progress}%)`,
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 10px',
            // 添加选中行的背景色
            backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : undefined,
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
              { label: '草稿', value: DemandStatus.DRAFT },
              { label: '已确认', value: DemandStatus.CONFIRMED },
              { label: '执行中', value: DemandStatus.EXECUTING },
              { label: '已完成', value: DemandStatus.COMPLETED },
              { label: '已取消', value: DemandStatus.CANCELLED },
            ]}
            onChange={(value) => {
              setSearchParams(prev => ({ ...prev, status: value }));
              actionRef.current?.reload();
            }}
          />
          <Input.Search
            placeholder="业务单号/客户订单号/客户编号/名称"
            style={{ width: 300 }}
            onSearch={(value) => {
              setSearchParams(prev => ({
                ...prev,
                keyword: value || undefined
              }));
              actionRef.current?.reload();
            }}
            allowClear
          />
        </Space>
      }
      request={async (params = {}, sort, filter) => {
        try {
          const { current, pageSize, ...restParams } = params;
          
          const pageParams: DemandPageRequest = {
            pageNum: current || 1,
            pageSize: pageSize || 10,
            ...restParams,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
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
      toolBarRender={() => [
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
  );
};

export default DemandManagement; 