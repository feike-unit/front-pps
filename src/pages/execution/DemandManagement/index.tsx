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
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { 
  Demand, 
  DemandStatus, 
  createDemand, 
  updateDemand, 
  getDemandPage, 
  DemandPageRequest,
  deleteDemand,
} from '../../../services/demand';
import { searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';

// 定义状态颜色映射
const statusColorMap: Record<string, string> = {
  'DRAFT': 'rgba(217, 217, 217, 0.15)', 
  'CONFIRMED': 'rgba(24, 144, 255, 0.15)', 
  'EXECUTING': 'rgba(24, 144, 255, 0.15)', 
  'COMPLETED': 'rgba(82, 196, 26, 0.15)', 
  'CANCELLED': 'rgba(255, 77, 79, 0.15)', 
};

const DemandManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<{
    productId?: number;
    status?: DemandStatus;
    deliveryDate?: string;
    businessDocNo?: string;
    customerOrderDocNo?: string;
    customerCode?: string;
    customerName?: string;
  }>({});
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
  const [localDeliveryDate, setLocalDeliveryDate] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

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
        DRAFT: { text: '草稿', status: 'default' },
        CONFIRMED: { text: '已确认', status: 'processing' },
        EXECUTING: { text: '执行中', status: 'processing' },
        COMPLETED: { text: '已完成', status: 'success' },
        CANCELLED: { text: '已取消', status: 'error' },
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
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<Demand>
            title="编辑需求"
            trigger={
              <Tooltip title="编辑">
                <a>
                  <EditOutlined />
                </a>
              </Tooltip>
            }
            initialValues={{
              ...record,
              parentId: record.parentId || undefined,
            }}
            modalProps={{
              destroyOnClose: true,
              width: 800,
            }}
            onFinish={async (values) => {
              try {
                const params = {
                  ...values,
                  parentId: values.parentId || 0,
                };
                await updateDemand(record.id!, params);
                message.success('更新成功');
                actionRef.current?.reload();
                return true;
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '更新失败');
                return false;
              }
            }}
          >
            <ProForm.Group>
              <ProFormTreeSelect
                name="parentId"
                label="上级需求"
                tooltip="不选择则为顶级需求"
                width="md"
                fieldProps={{
                  treeData,
                  treeDefaultExpandAll: true,
                  showSearch: true,
                  treeNodeFilterProp: 'title',
                  placeholder: '不选择则为顶级需求',
                  allowClear: true,
                }}
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDigit
                name="productId"
                label="货品ID"
                rules={[{ required: true, message: '请输入货品ID' }]}
                width="md"
              />
              <ProFormSelect
                name="productType"
                label="货品类型"
                rules={[{ required: true, message: '请选择货品类型' }]}
                width="md"
                options={[
                  { label: '采购件', value: 1 },
                  { label: '自制件', value: 2 },
                  { label: '委外件', value: 3 },
                ]}
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDigit
                name="demandQuantity"
                label="需求数量"
                rules={[{ required: true, message: '请输入需求数量' }]}
                min={0}
                width="md"
              />
              <ProFormDatePicker
                name="deliveryDate"
                label="交期"
                rules={[{ required: true, message: '请选择交期' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="businessKey"
                label="业务标识"
                width="md"
              />
              <ProFormText
                name="businessType"
                label="业务类型"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="businessDocNo"
                label="业务单号"
                width="md"
              />
              <ProFormText
                name="customerOrderDocNo"
                label="客户订单号"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="customerCode"
                label="客户编号"
                width="md"
              />
              <ProFormText
                name="customerName"
                label="客户名称"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormSelect
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                width="md"
                options={[
                  { label: '草稿', value: 'DRAFT' },
                  { label: '已确认', value: 'CONFIRMED' },
                  { label: '执行中', value: 'EXECUTING' },
                  { label: '已完成', value: 'COMPLETED' },
                  { label: '已取消', value: 'CANCELLED' },
                ]}
              />
            </ProForm.Group>
            <ProFormTextArea
              name="remark"
              label="备注"
              width="xl"
            />
          </ModalForm>
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
              <a>
                <DeleteOutlined style={{ color: '#ff4d4f' }} />
              </a>
            </Tooltip>
          </Popconfirm>
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
      scroll={{ x: 'max-content' }}
      components={components}
      onRow={(record) => {
        const completionQuantity = record.completionQuantity || 0;
        const purgeQuantity = record.purgeQuantity || 0;
        const progress = purgeQuantity > 0 ? (completionQuantity / purgeQuantity) * 100 : 0;
        
        // 使用状态颜色映射获取背景色
        const bgColor = statusColorMap[record.status] || statusColorMap['DRAFT'];

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
          <DatePicker
            placeholder="交期"
            style={{ width: 200 }}
            onChange={(date) => {
              const dateString = date ? date.format('YYYY-MM-DD') : undefined;
              console.log('选择日期:', dateString);
              // 设置本地状态用于前端过滤
              setLocalDeliveryDate(dateString);
              // 触发表格刷新
              actionRef.current?.reload();
            }}
            allowClear
          />
          <Input.Search
            placeholder="业务单号/客户订单号"
            style={{ width: 200 }}
            onSearch={(value) => {
              setSearchParams(prev => ({
                ...prev,
                businessDocNo: value || undefined,
                customerOrderDocNo: value || undefined
              }));
              actionRef.current?.reload();
            }}
            allowClear
          />
          <Input.Search
            placeholder="客户编号/名称"
            style={{ width: 200 }}
            onSearch={(value) => {
              setSearchParams(prev => ({
                ...prev,
                customerCode: value || undefined,
                customerName: value || undefined
              }));
              actionRef.current?.reload();
            }}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 200 }}
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
        </Space>
      }
      request={async (params = {}, sort, filter) => {
        try {
          const { current, pageSize, ...restParams } = params;
          
          // 构建请求参数
          const pageParams: DemandPageRequest = {
            pageNum: current || 1,
            pageSize: pageSize || 10,
            ...restParams,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };
          
          console.log('查询参数:', pageParams);
          
          const result = await getDemandPage(pageParams);
          
          // 前端过滤逻辑
          let filteredData = result.list;
          
          // 交期过滤
          if (localDeliveryDate) {
            filteredData = filteredData.filter(item => 
              item.deliveryDate && item.deliveryDate.substring(0, 10) === localDeliveryDate
            );
          }
          
          // 如果后端接口没有实现这些参数的过滤，则在前端进行过滤
          // 业务单号过滤
          if (searchParams.businessDocNo) {
            filteredData = filteredData.filter(item =>
              item.businessDocNo && item.businessDocNo.includes(searchParams.businessDocNo!)
            );
          }
          
          // 客户订单号过滤
          if (searchParams.customerOrderDocNo) {
            filteredData = filteredData.filter(item =>
              item.customerOrderDocNo && item.customerOrderDocNo.includes(searchParams.customerOrderDocNo!)
            );
          }
          
          // 客户编号过滤
          if (searchParams.customerCode) {
            filteredData = filteredData.filter(item =>
              item.customerCode && item.customerCode.includes(searchParams.customerCode!)
            );
          }
          
          // 客户名称过滤
          if (searchParams.customerName) {
            filteredData = filteredData.filter(item =>
              item.customerName && item.customerName.includes(searchParams.customerName!)
            );
          }
          
          return {
            data: filteredData,
            success: true,
            total: (localDeliveryDate || searchParams.businessDocNo || searchParams.customerOrderDocNo || 
                    searchParams.customerCode || searchParams.customerName) ? filteredData.length : result.total,
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
        pageSize: 10,
        showQuickJumper: true,
        showSizeChanger: true,
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
        <ModalForm<Demand>
          key="create"
          title="新建需求"
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建需求
            </Button>
          }
          modalProps={{
            destroyOnClose: true,
            width: 800,
          }}
          initialValues={{
            status: DemandStatus.DRAFT,
            productType: 1,
          }}
          onFinish={async (values) => {
            try {
              const params = {
                ...values,
                parentId: values.parentId || 0,
              };
              await createDemand(params);
              message.success('创建成功');
              actionRef.current?.reload();
              return true;
            } catch (error) {
              const apiError = error as ApiError;
              message.error(apiError.response?.data?.message || apiError.message || '创建失败');
              return false;
            }
          }}
        >
          <ProForm.Group>
            <ProFormTreeSelect
              name="parentId"
              label="上级需求"
              tooltip="不选择则为顶级需求"
              width="md"
              fieldProps={{
                treeData,
                treeDefaultExpandAll: true,
                showSearch: true,
                treeNodeFilterProp: 'title',
                placeholder: '不选择则为顶级需求',
                allowClear: true,
              }}
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormDigit
              name="productId"
              label="货品ID"
              rules={[{ required: true, message: '请输入货品ID' }]}
              width="md"
            />
            <ProFormSelect
              name="productType"
              label="货品类型"
              rules={[{ required: true, message: '请选择货品类型' }]}
              width="md"
              options={[
                { label: '采购件', value: 1 },
                { label: '自制件', value: 2 },
                { label: '委外件', value: 3 },
              ]}
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormDigit
              name="demandQuantity"
              label="需求数量"
              rules={[{ required: true, message: '请输入需求数量' }]}
              min={0}
              width="md"
            />
            <ProFormDatePicker
              name="deliveryDate"
              label="交期"
              rules={[{ required: true, message: '请选择交期' }]}
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="businessKey"
              label="业务标识"
              width="md"
            />
            <ProFormText
              name="businessType"
              label="业务类型"
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="businessDocNo"
              label="业务单号"
              width="md"
            />
            <ProFormText
              name="customerOrderDocNo"
              label="客户订单号"
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="customerCode"
              label="客户编号"
              width="md"
            />
            <ProFormText
              name="customerName"
              label="客户名称"
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormSelect
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
              width="md"
              options={[
                { label: '草稿', value: 'DRAFT' },
                { label: '已确认', value: 'CONFIRMED' },
              ]}
            />
          </ProForm.Group>
          <ProFormTextArea
            name="remark"
            label="备注"
            width="xl"
          />
        </ModalForm>,
      ]}
    />
  );
};

export default DemandManagement; 