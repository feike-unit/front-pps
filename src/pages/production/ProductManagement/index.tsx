import React, { useRef, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import {
  Button,
  Space,
  message,
  Input,
  Select,
  DatePicker,
  Modal,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable,
} from '@ant-design/pro-components';
import { SyncOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import { 
  Product, 
  getProductPage, 
  syncProducts,
  ProductPageRequest, 
  ProductType,
  ProductStatus,
} from '../../../services/product';
import { searchLines } from '../../../services/line';
import type { Line } from '../../../services/line';
import zhCN from 'antd/es/date-picker/locale/zh_CN';


const ProductManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
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
      title: '货品编码',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      width: 100,
    },
    {
      title: '货品名称',
      dataIndex: 'productName',
      copyable: true,
      ellipsis: true,
      width: 240,
    },
    {
      title: '规格型号',
      dataIndex: 'model',
      ellipsis: true,
      search: false,
      width: 80,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      ellipsis: true,
      search: false,
      width: 60,
    },
    {
      title: '属性',
      dataIndex: 'productType',
      ellipsis: true,
      valueType: 'select',
      valueEnum: {
        [ProductType.PURCHASE]: { text: '采购件' },
        [ProductType.SELF_MADE]: { text: '自制件' },
        [ProductType.OUTSOURCED]: { text: '委外件' },
      },
      width: 60,
    },
    {
      title: '提前期(天)',
      dataIndex: 'advanceDay',
      ellipsis: true,
      search: false,
      width: 60,
    },
    {
      title: '时均产能',
      dataIndex: 'dailyCapacity',
      ellipsis: true,
      search: false,
      width: 60,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 60,
      valueEnum: {
        [ProductStatus.ENABLED]: { text: '启用', status: 'Success' },
        [ProductStatus.DISABLED]: { text: '禁用', status: 'Error' },
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      width: 140,
      hideInSearch: true,
    }
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
        defaultPageSize: 100,
        showQuickJumper: false,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      dateFormatter="string"
      toolBarRender={() => [
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
                  <DatePicker locale={zhCN}
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
