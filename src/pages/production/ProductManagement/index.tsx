import React, { useRef, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Input,
  Select,
  DatePicker,
  Modal,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { 
  Product, 
  getProductPage, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductStatus,
  syncProducts,
  ProductPageRequest, 
  ProductType,
  ProductStatus,
  getProductById
} from '../../../services/product';
import { searchLines } from '../../../services/line';
import type { Line } from '../../../services/line';
import type { CapacityRule } from '../../../services/capacityRule';
import { EditableProTable } from '@ant-design/pro-components';

type CapacityRuleCreatorProps = {
  id: number;
  lineId: number;
  productId: number;
  worksHourCapacity: number;
  remark: string;
};

const ProductManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [capacityRules, setCapacityRules] = useState<CapacityRule[]>([]);
  const [editingProductId, setEditingProductId] = useState<number>();
  const [lines, setLines] = useState<Line[]>([]);

  // 初始化获取拉线数据
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const lines = await searchLines('');
        console.log('Loaded lines:', lines); // 调试日志
        setLines(lines);
      } catch (error) {
        const apiError = error as ApiError;
        message.error(apiError.response?.data?.message || apiError.message || '获取拉线数据失败');
      }
    };
    fetchLines();
  }, []);
  const [searchParams, setSearchParams] = useState<{
    keyword?: string;
    productType?: ProductType;
  }>({
    // 默认选择自制件
    productType: ProductType.SELF_MADE,
  });

  // ProTable 列定义
  const columns: ProColumns<Product>[] = [
    {
      title: '货品编号/名称',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      tip: '支持货品编号或名称模糊搜索',
      render: (_, record) => `${record.productCode} - ${record.productName}`,
      width: 200,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      copyable: true,
      ellipsis: true,
      sorter: true,
      hideInTable: true,
    },
    {
      title: '规格型号',
      dataIndex: 'model',
      ellipsis: true,
      search: false,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      ellipsis: true,
      search: false,
    },
    {
      title: '货品类型',
      dataIndex: 'productType',
      ellipsis: true,
      valueType: 'select',
      valueEnum: {
        [ProductType.PURCHASE]: { text: '采购件' },
        [ProductType.SELF_MADE]: { text: '自制件' },
        [ProductType.OUTSOURCED]: { text: '委外件' },
      },
    },
    {
      title: '交货周期(天)',
      dataIndex: 'deliveryCycle',
      ellipsis: true,
      search: false,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        [ProductStatus.ENABLED]: { text: '启用', status: 'Success' },
        [ProductStatus.DISABLED]: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === ProductStatus.ENABLED}
          onChange={async (checked) => {
            try {
              await updateProductStatus(record.id!, checked ? ProductStatus.ENABLED : ProductStatus.DISABLED);
              message.success('状态更新成功');
              actionRef.current?.reload();
            } catch (error) {
              const apiError = error as ApiError;
              message.error(apiError.response?.data?.message || apiError.message || '状态更新失败');
            }
          }}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<Product>
            title="编辑货品"
            trigger={
              <Tooltip title="编辑">
                <a><EditOutlined style={{ color: '#1890ff' }} /></a>
              </Tooltip>
            }
            initialValues={{
              ...record,
              capacityRules: record.capacityRules || []
            }}
            onValuesChange={(changedValues) => {
              if (changedValues.capacityRules) {
                setCapacityRules(changedValues.capacityRules);
              }
            }}
            request={async () => {
              try {
                // 获取最新的货品详情
                const latestProduct = await getProductById(record.id!);
                // 更新产能规则状态
                setCapacityRules(latestProduct.capacityRules || []);
                return latestProduct;
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '获取货品详情失败');
                return record;
              }
            }}
            onFinish={async (values) => {
              try {
                // 检查是否有重复的拉线
                const lineIds = values.capacityRules?.map(rule => rule.lineId) || [];
                const duplicateLines = lineIds.filter((id, index) => lineIds.indexOf(id) !== index);
                if (duplicateLines.length > 0) {
                  // 获取重复的拉线名称
                  const duplicateLineNames = lines
                    .filter(line => duplicateLines.includes(line.id!))
                    .map(line => `${line.lineCode} - ${line.lineName}`)
                    .join(', ');
                  message.error(`存在重复的拉线: ${duplicateLineNames}`);
                  return false;
                }

                // 更新产品基本信息
                const productData = {
                  productCode: values.productCode,
                  productName: values.productName,
                  model: values.model,
                  unit: values.unit,
                  productType: values.productType,
                  deliveryCycle: values.deliveryCycle,
                  status: values.status ? 1 : 0,
                  remark: values.remark,
                  capacityRules: values.capacityRules?.map(rule => ({
                    ...rule,
                    status: rule.status ? 1 : 0,
                    productId: record.id
                  })) || []
                };
                await updateProduct(record.id!, productData);

                message.success('更新成功');
                actionRef.current?.reload();
                return true;
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '更新失败');
                return false;
              }
            }}
            modalProps={{
              destroyOnClose: true,
            }}
          >
            <ProForm.Group>
              <ProFormText
                name="productCode"
                label="货品编号"
                rules={[{ required: true, message: '请输入货品编号' }]}
                width="md"
              />
              <ProFormText
                name="productName"
                label="货品名称"
                rules={[{ required: true, message: '请输入货品名称' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormText
                name="model"
                label="规格型号"
                width="md"
              />
              <ProFormText
                name="unit"
                label="单位"
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormSelect
                name="productType"
                label="货品类型"
                options={[
                  { label: '采购件', value: ProductType.PURCHASE },
                  { label: '自制件', value: ProductType.SELF_MADE },
                  { label: '委外件', value: ProductType.OUTSOURCED },
                ]}
                rules={[{ required: true, message: '请选择货品类型' }]}
                width="md"
              />
              <ProFormDigit
                name="deliveryCycle"
                label="交货周期(天)"
                min={0}
                width="md"
              />
            </ProForm.Group>
            <ProFormTextArea
              name="remark"
              label="备注"
              width="xl"
            />
            <ProForm.Group>
              <ProFormSwitch
                name="status"
                label="状态"
                checkedChildren="启用"
                unCheckedChildren="禁用"
                initialValue={1}
                transform={(value) => value ? 1 : 0}
                fieldProps={{
                  defaultChecked: true,
                }}
              />
            </ProForm.Group>

            <ProForm.Item
              label="产能规则"
              name="capacityRules"
              trigger="onValuesChange"
            >
              <EditableProTable<CapacityRule>
                rowKey="id"
                columns={[
                  {
                    title: '拉线',
                    dataIndex: 'lineId',
                    valueType: 'select',
                    fieldProps: {
                      showSearch: true,
                      filterOption: (input: string, option?: { label: string }) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                    },
                    request: async () => {
                      const lines = await searchLines('');
                      return lines.map(line => ({
                        label: `${line.lineCode} - ${line.lineName}`,
                        value: line.id,
                      }));
                    },
                    formItemProps: {
                      rules: [{ required: true, message: '请选择拉线' }],
                    },
                  },
                  {
                    title: '工时产能',
                    dataIndex: 'worksHourCapacity',
                    valueType: 'digit',
                    fieldProps: {
                      min: 0,
                      precision: 2,
                    },
                    formItemProps: {
                      rules: [{ required: true, message: '请输入工时产能' }],
                    },
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    valueType: 'switch',
                    initialValue: 1,
                    fieldProps: {
                      checkedChildren: '启用',
                      unCheckedChildren: '禁用',
                    },
                    render: (_, record, __, action) => (
                      <Switch
                        checked={record.status === 1}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                        onChange={(checked) => {
                          const newStatus = checked ? 1 : 0;
                          record.status = newStatus;
                          action?.reload();
                        }}
                      />
                    ),
                  },
                  {
                    title: '备注',
                    dataIndex: 'remark',
                    valueType: 'text',
                  },
                  {
                    title: '操作',
                    valueType: 'option',
                    width: 120,
                    render: (text, record, _, action) => [
                      <a
                        key="delete"
                        onClick={() => {
                          if (record.id) {
                            setCapacityRules(capacityRules.filter(item => item.id !== record.id));
                          }
                        }}
                      >
                        删除
                      </a>,
                    ],
                  },
                ]}
                value={capacityRules}
                onChange={(value) => setCapacityRules([...value])}
                editable={{
                  type: 'multiple',
                  editableKeys: capacityRules.map(item => item.id).filter(Boolean) as React.Key[],
                  actionRender: (row, config, defaultDoms) => {
                    return [defaultDoms.delete];
                  },
                  onValuesChange: (record, recordList) => {
                    setCapacityRules(recordList);
                  },
                }}
                recordCreatorProps={{
                  newRecordType: 'dataSource',
                  record: () => {
                    // 找到第一个未被使用的拉线
                    const unusedLine = lines.find(line => 
                      line.id !== undefined && 
                      !capacityRules.some(rule => rule.lineId === line.id)
                    );
                    
                    return {
                      id: Date.now(),
                      lineId: unusedLine?.id || 0,
                      productId: editingProductId || 0,
                      worksHourCapacity: 1.00,
                      status: 1,
                      remark: '',
                    };
                  },
                  creatorButtonText: '添加产能规则',
                  position: 'bottom',
                  disabled: !lines.some(line => 
                    line.id !== undefined && 
                    !capacityRules.some(rule => rule.lineId === line.id)
                  ),
                }}
                bordered
                scroll={{ y: 300 }}
              />
            </ProForm.Item>
          </ModalForm>
          <Popconfirm
            title="确定要删除该货品吗？"
            onConfirm={async () => {
              try {
                await deleteProduct(record.id!);
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
    <ProTable<Product>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      bordered
      defaultSize="small"
      request={async (params = {}, sort, filter) => {
        try {
          // 构建查询参数
          const queryParams: ProductPageRequest = {
            pageNum: params.current as number,
            pageSize: params.pageSize as number,
            ...searchParams, // 包含默认的 productType
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };
          
          const result = await getProductPage(queryParams);
          
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
      headerTitle={
        <Space>
          <Input 
            placeholder="货品编号/名称"
            onChange={debounce((e) => {
              const value = e.target.value;
              // 设置关键字，后端会同时搜索编码和名称字段
              setSearchParams(prev => ({ 
                ...prev, 
                keyword: value 
              }));
              actionRef.current?.reload();
            }, 500)} // 500毫秒的防抖延迟
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="货品类型"
            style={{ width: 200 }}
            allowClear
            defaultValue={ProductType.SELF_MADE}
            options={[
              { label: '采购件', value: ProductType.PURCHASE },
              { label: '自制件', value: ProductType.SELF_MADE },
              { label: '委外件', value: ProductType.OUTSOURCED },
            ]}
            onChange={(value: ProductType | undefined) => {
              setSearchParams(prev => ({ ...prev, productType: value }));
              actionRef.current?.reload();
            }}
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
        <ModalForm<Product>
          key="create"
          title="新建货品"
          trigger={
            <Button type="primary" onClick={() => {
              setEditingProductId(undefined);
              setCapacityRules([]);
            }}>
              <PlusOutlined />
              新建
            </Button>
          }
          onFinish={async (values) => {
            try {
              // 检查是否有重复的拉线
              const lineIds = values.capacityRules?.map(rule => rule.lineId) || [];
              const duplicateLines = lineIds.filter((id, index) => lineIds.indexOf(id) !== index);
              if (duplicateLines.length > 0) {
                // 获取重复的拉线名称
                const duplicateLineNames = lines
                  .filter(line => duplicateLines.includes(line.id!))
                  .map(line => `${line.lineCode} - ${line.lineName}`)
                  .join(', ');
                message.error(`存在重复的拉线: ${duplicateLineNames}`);
                return false;
              }

              // 创建产品基本信息
              const productData = {
                productCode: values.productCode,
                productName: values.productName,
                model: values.model,
                unit: values.unit,
                productType: values.productType,
                deliveryCycle: values.deliveryCycle,
                status: values.status ? 1 : 0,
                remark: values.remark,
                capacityRules: values.capacityRules?.map(rule => ({
                  ...rule,
                  status: rule.status ? 1 : 0,
                  productId: 0 // 创建时先设置为0，后端会自动设置正确的ID
                })) || []
              };
              const product = await createProduct(productData);

              message.success('创建成功');
              actionRef.current?.reload();
              return true;
            } catch (error) {
              const apiError = error as ApiError;
              message.error(apiError.response?.data?.message || apiError.message || '创建失败');
              return false;
            }
          }}
          modalProps={{
            destroyOnClose: true,
          }}
        >
          <ProForm.Group>
            <ProFormText
              name="productCode"
              label="货品编号"
              rules={[{ required: true, message: '请输入货品编号' }]}
              width="md"
            />
            <ProFormText
              name="productName"
              label="货品名称"
              rules={[{ required: true, message: '请输入货品名称' }]}
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormText
              name="model"
              label="规格型号"
              width="md"
            />
            <ProFormText
              name="unit"
              label="单位"
              width="md"
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormSelect
              name="productType"
              label="货品类型"
              options={[
                { label: '采购件', value: ProductType.PURCHASE },
                { label: '自制件', value: ProductType.SELF_MADE },
                { label: '委外件', value: ProductType.OUTSOURCED },
              ]}
              rules={[{ required: true, message: '请选择货品类型' }]}
              width="md"
            />
            <ProFormDigit
              name="deliveryCycle"
              label="交货周期(天)"
              min={0}
              width="md"
            />
          </ProForm.Group>
          <ProFormTextArea
            name="remark"
            label="备注"
            width="xl"
          />
          <ProForm.Group>
            <ProFormSwitch
              name="status"
              label="状态"
              checkedChildren="启用"
              unCheckedChildren="禁用"
              initialValue={1}
              transform={(value) => value ? 1 : 0}
              fieldProps={{
                defaultChecked: true,
              }}
            />
          </ProForm.Group>

          <ProForm.Item
            label="产能规则"
            name="capacityRules"
            trigger="onValuesChange"
          >
            <EditableProTable<CapacityRule>
              rowKey="id"
              columns={[
                {
                  title: '拉线',
                  dataIndex: 'lineId',
                  valueType: 'select',
                  fieldProps: {
                    showSearch: true,
                    filterOption: (input: string, option?: { label: string }) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                  },
                  request: async () => {
                    const lines = await searchLines('');
                    return lines.map(line => ({
                      label: `${line.lineCode} - ${line.lineName}`,
                      value: line.id,
                    }));
                  },
                  formItemProps: {
                    rules: [{ required: true, message: '请选择拉线' }],
                  },
                },
                {
                  title: '工时产能',
                  dataIndex: 'worksHourCapacity',
                  valueType: 'digit',
                  fieldProps: {
                    min: 0,
                    precision: 2,
                  },
                  formItemProps: {
                    rules: [{ required: true, message: '请输入工时产能' }],
                  },
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  valueType: 'switch',
                  initialValue: 1,
                  fieldProps: {
                    checkedChildren: '启用',
                    unCheckedChildren: '禁用',
                  },
                  render: (_, record, __, action) => (
                    <Switch
                      checked={record.status === 1}
                      checkedChildren="启用"
                      unCheckedChildren="禁用"
                      onChange={(checked) => {
                        const newStatus = checked ? 1 : 0;
                        record.status = newStatus;
                        action?.reload();
                      }}
                    />
                  ),
                },
                {
                  title: '备注',
                  dataIndex: 'remark',
                  valueType: 'text',
                },
                {
                  title: '操作',
                  valueType: 'option',
                  width: 120,
                  render: (text, record, _, action) => [
                    <a
                      key="delete"
                      onClick={() => {
                        if (record.id) {
                          setCapacityRules(capacityRules.filter(item => item.id !== record.id));
                        }
                      }}
                    >
                      删除
                    </a>,
                  ],
                },
              ]}
              value={capacityRules}
              onChange={(value) => setCapacityRules([...value])}
              editable={{
                type: 'multiple',
                editableKeys: capacityRules.map(item => item.id).filter(Boolean) as React.Key[],
                actionRender: (row, config, defaultDoms) => {
                  return [defaultDoms.delete];
                },
                onValuesChange: (record, recordList) => {
                  setCapacityRules(recordList);
                },
              }}
              recordCreatorProps={{
                newRecordType: 'dataSource',
                record: () => {
                  // 找到第一个未被使用的拉线
                  const unusedLine = lines.find(line => 
                    line.id !== undefined && 
                    !capacityRules.some(rule => rule.lineId === line.id)
                  );
                  
                  return {
                    id: Date.now(),
                    lineId: unusedLine?.id || 0,
                    productId: editingProductId || 0,
                    worksHourCapacity: 1.00,
                    status: 1,
                    remark: '',
                  };
                },
                creatorButtonText: '添加产能规则',
                position: 'bottom',
                disabled: !lines.some(line => 
                  line.id !== undefined && 
                  !capacityRules.some(rule => rule.lineId === line.id)
                ),
              }}
              bordered
              scroll={{ y: 300 }}
            />
          </ProForm.Item>
        </ModalForm>,
        <Button
          key="sync"
          onClick={() => {
            // 创建日期选择器弹窗
            let syncDate: string | undefined;
            Modal.confirm({
              title: '同步货品',
              content: (
                <div style={{ marginTop: 16 }}>
                  <span style={{ color: '#ff4d4f' }}>* </span>
                  <span>选择同步日期：</span>
                  <DatePicker 
                    onChange={(date) => {
                      syncDate = date ? date.format('YYYY-MM-DD') : undefined;
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
                  await syncProducts(syncDate);
                  message.success('同步货品成功');
                  actionRef.current?.reload();
                } catch (error) {
                  const apiError = error as ApiError;
                  message.error(apiError.response?.data?.message || apiError.message || '同步货品失败');
                }
              }
            });
          }}
        >
          <SyncOutlined />
          同步货品
        </Button>,
      ]}
    />
  );
};

export default ProductManagement;
