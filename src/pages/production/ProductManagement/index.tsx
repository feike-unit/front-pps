import React, { useRef, useState } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Input,
  Select,
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
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { 
  Product, 
  getProductPage, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductStatus, 
  ProductPageRequest, 
  ProductType,
  ProductStatus
} from '../../../services/product';

const ProductManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [searchParams, setSearchParams] = useState<{
    productCode?: string;
    productName?: string;
    productType?: ProductType;
  }>({});

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
            initialValues={record}
            onFinish={async (values) => {
              try {
                const params = {
                  productCode: values.productCode,
                  productName: values.productName,
                  model: values.model,
                  unit: values.unit,
                  productType: values.productType,
                  deliveryCycle: values.deliveryCycle,
                  status: values.status ? ProductStatus.ENABLED : ProductStatus.DISABLED,
                  remark: values.remark,
                };
                await updateProduct(record.id!, params);
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
                initialValue={true}
              />
            </ProForm.Group>
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
          const { current, pageSize, ...restParams } = params;
          
          // 构建请求参数
          const requestParams: ProductPageRequest = {
            pageNum: current || 1,
            pageSize: pageSize || 10,
            ...restParams,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };
          
          const result = await getProductPage(requestParams);
          
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
          <Input.Search
            placeholder="货品编号/名称"
            onSearch={(value) => {
              // 同时设置编码和名称，后端可以同时搜索这两个字段
              setSearchParams(prev => ({ 
                ...prev, 
                productCode: value,
                productName: value 
              }));
              actionRef.current?.reload();
            }}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="货品类型"
            style={{ width: 200 }}
            allowClear
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
            <Button type="primary">
              <PlusOutlined />
              新建
            </Button>
          }
          onFinish={async (values) => {
            try {
              const params = {
                ...values,
                status: values.status ? ProductStatus.ENABLED : ProductStatus.DISABLED,
              };
              await createProduct(params);
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
              initialValue={true}
            />
          </ProForm.Group>
        </ModalForm>,
      ]}
    />
  );
};

export default ProductManagement; 