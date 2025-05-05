import React, { useRef } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
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
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { Product, getProducts, createProduct, updateProduct, deleteProduct, updateProductStatus } from '../../../services/product';

const ProductManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // ProTable 列定义
  const columns: ProColumns<Product>[] = [
    {
      title: '货品编号',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      copyable: true,
      ellipsis: true,
      sorter: true,
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
        1: { text: '采购件' },
        2: { text: '自制件' },
        3: { text: '委外件' },
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
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          onChange={async (checked) => {
            try {
              await updateProductStatus(record.id, checked ? 1 : 0);
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
                <Button type="link" icon={<EditOutlined />} />
              </Tooltip>
            }
            initialValues={record}
            onFinish={async (values) => {
              try {
                await updateProduct(record.id, values);
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
                  { label: '采购件', value: 1 },
                  { label: '自制件', value: 2 },
                  { label: '委外件', value: 3 },
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
          </ModalForm>
          <Popconfirm
            title="确定要删除该货品吗？"
            onConfirm={async () => {
              try {
                await deleteProduct(record.id);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (error) {
                const apiError = error as ApiError;
                message.error(apiError.response?.data?.message || apiError.message || '删除失败');
              }
            }}
          >
            <Tooltip title="删除">
              <Button type="link" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
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
      request={async (params = {}, sort, filter) => {
        try {
          const { current, pageSize, ...restParams } = params;
          // 处理排序参数
          const sortParams = Object.entries(sort || {}).map(([key, value]) => ({
            field: key,
            order: value === 'ascend' ? 'asc' : 'desc',
          }));
          
          const result = await getProducts({
            page: current,
            size: pageSize,
            ...restParams,
            sort: sortParams,
            ...filter,
          });
          
          return {
            data: result.data,
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
      search={{
        labelWidth: 'auto',
      }}
      pagination={{
        pageSize: 10,
      }}
      dateFormatter="string"
      headerTitle="货品管理"
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
              await createProduct(values);
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
                { label: '采购件', value: 1 },
                { label: '自制件', value: 2 },
                { label: '委外件', value: 3 },
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
        </ModalForm>,
      ]}
    />
  );
};

export default ProductManagement; 