import React, { useRef, useState, useEffect } from 'react';
import { useTimeout } from 'ahooks';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  InputNumber,
  Select,
  Form,
  Input,
  DatePicker,
} from 'antd';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { 
  ProTable,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDateTimeRangePicker,
  ProFormSwitch,
  ProFormDatePicker,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import {
  CapacityRule,
  createCapacityRule,
  updateCapacityRule,
  deleteCapacityRule,
  getCapacityRulePage,
  updateCapacityRuleStatus,
  CapacityRulePageRequest,
} from '../../../services/capacityRule';
import { Line, searchLines } from '../../../services/line';
import { Product, searchProducts } from '../../../services/product';
import debounce from 'lodash/debounce';
import './index.css';

const CapacityRuleManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLineOptions, setSearchLineOptions] = useState<{ label: string; value: number | undefined; lineData: Line }[]>([]);
  const [lineOptions, setLineOptions] = useState<{ label: string; value: number; }[]>([]);
  const [productOptions, setProductOptions] = useState<{ label: string; value: number; }[]>([]);
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number | undefined; productData: Product }[]>([]);
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);
  const [tableData, setTableData] = useState<CapacityRule[]>([]);
  const [searchParams, setSearchParams] = useState<{
    lineId?: number;
    productId?: number;
    status?: number;
  }>({});

  // 使用 useTimeout 优化高亮闪烁效果
  useTimeout(() => {
    if (highlightedRowId !== null) {
      setHighlightedRowId(null);
    }
  }, highlightedRowId ? 3000 : undefined);

  // 高亮闪烁效果
  const highlightRow = (lineId: number, productId: number) => {
    // 查找当前表格数据中匹配的记录
    const existingRule = tableData.find(
      rule => rule.lineId === lineId && rule.productId === productId
    );

    if (existingRule && typeof existingRule.id === 'number') {
      setHighlightedRowId(existingRule.id);
    }
  };

  // 初始化必要的数据
  useEffect(() => {
    // 直接初始化空数据，按需通过搜索接口获取
    setLines([]);
    setProducts([]);
  }, []);

  // 获取拉线选项
  const fetchLineOptions = async (keyword: string): Promise<{ label: string; value: number; }[]> => {
    try {
      const lines = await searchLines(keyword);
      return lines.map(line => ({
        label: `${line.lineCode} - ${line.lineName}`,
        value: line.id!,
      }));
    } catch (apiError: any) {
      message.error(apiError.response?.data?.message || apiError.message || '获取拉线列表失败');
      return [];
    }
  };

  // 获取货品选项
  const fetchProductOptions = async (keyword: string): Promise<{ label: string; value: number; }[]> => {
    try {
      const products = await searchProducts(keyword);
      return products.map(product => ({
        label: `${product.productCode} - ${product.productName}`,
        value: product.id!,
      }));
    } catch (apiError: any) {
      message.error(apiError.response?.data?.message || apiError.message || '获取货品列表失败');
      return [];
    }
  };

  // 防抖处理
  const debouncedFetchLineOptions = debounce(fetchLineOptions, 500);
  const debouncedFetchProductOptions = debounce(fetchProductOptions, 500);

  // 处理拉线搜索
  const handleLineSearch = debounce(async (value: string) => {
    try {
      const lines = await searchLines(value || '');
      const options = lines.map(line => ({
        label: `${line.lineCode} - ${line.lineName}`,
        value: line.id!,
        // 存储完整的line对象，用于获取ID
        lineData: line
      }));
      
      // 直接设置新的选项，而不是累加
      setSearchLineOptions(options);
      // 更新lines数据，用于选项映射
      setLines(lines);
    } catch (error: any) {
      message.error('搜索拉线失败');
    }
  }, 500);

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
      const products = await searchProducts(value || '');
      const options = products.map(product => ({
        label: `${product.productCode} - ${product.productName}`,
        value: product.id,
        // 存储完整的product对象，用于获取ID
        productData: product
      }));
      
      // 直接设置新的选项，而不是累加
      setSearchProductOptions(options);
      // 更新products数据，用于选项映射
      setProducts(products);
    } catch (error: any) {
      message.error('搜索货品失败');
    }
  }, 500);

  // 初始加载默认选项
  useEffect(() => {
    handleLineSearch('');
    handleProductSearch('');
  }, []);

  // ProTable 列定义
  const columns: ProColumns<CapacityRule>[] = [
    {
      title: '拉线编号/名称',
      dataIndex: 'lineCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      render: (_, record) => `${record.lineCode} - ${record.lineName}`,
      valueType: 'select',
      width: 200,
      fieldProps: {
        showSearch: true,
        placeholder: '请输入拉线编号或名称搜索',
        defaultActiveFirstOption: false,
        filterOption: false,
        onSearch: handleLineSearch,
        options: searchLineOptions,
        notFoundContent: null,
        allowClear: true,
        onClick: () => handleLineSearch(''),
      },
    },
    {
      title: '拉线名称',
      dataIndex: 'lineName',
      ellipsis: true,
      search: false,
      hideInTable: true,
    },
    {
      title: '拉线投产日期',
      dataIndex: 'lineStartDate',
      valueType: 'date',
      ellipsis: true,
      search: false,
    },
    {
      title: '拉线工时',
      dataIndex: 'lineWorksHour',
      ellipsis: true,
      search: false,
    },
    {
      title: '货品编号/名称',
      dataIndex: 'productCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      render: (_, record) => `${record.productCode} - ${record.productName}`,
      valueType: 'select',
      width: 200,
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
      title: '工时产能',
      dataIndex: 'worksHourCapacity',
      sorter: true,
      search: false,
      renderFormItem: () => (
        <ProFormDigit
          name="worksHourCapacityRange"
          label="工时产能范围"
        />
      ),
    },
    {
      title: '系数',
      dataIndex: 'coefficient',
      sorter: true,
      search: false,
      render: (_, record) => record.coefficient,
    },
    {
      title: '日产能(件/天)',
      dataIndex: 'dailyCapacity',
      search: false,
      render: (_, record) => {
        const dailyCapacity = record.lineWorksHour && record.worksHourCapacity && record.coefficient
          ? (record.lineWorksHour * record.worksHourCapacity * record.coefficient).toFixed(2)
          : '-';
        return dailyCapacity;
      },
      tooltip: '日产能 = (拉线工时 × 工时产能) × 系数',
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
              await updateCapacityRuleStatus(record.id!, checked ? 1 : 0);
              message.success('状态更新成功');
              actionRef.current?.reload();
            } catch (apiError: any) {
              message.error(apiError.response?.data?.message || apiError.message || '状态更新失败');
            }
          }}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
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
          <ModalForm<CapacityRule>
            title="编辑产能规则"
            formRef={formRef}
            trigger={
              <Tooltip title="编辑">
                <a><EditOutlined style={{ color: '#1890ff' }} /></a>
              </Tooltip>
            }
            initialValues={record}
            onFinish={async (values) => {
              try {
                await updateCapacityRule(record.id!, {
                  lineId: values.lineId,
                  productId: values.productId,
                  worksHourCapacity: values.worksHourCapacity,
                  coefficient: values.coefficient,
                  status: values.status,
                  remark: values.remark,
                });
                message.success('更新成功');
                actionRef.current?.reload();
                return true;
              } catch (apiError: any) {
                const errorMessage = apiError.response?.data?.message || apiError.message || '更新失败';
                message.error(errorMessage);
                // 如果是重复记录错误，高亮显示已存在的记录
                if (errorMessage.includes('已存在')) {
                  highlightRow(values.lineId, values.productId);
                }
                return false;
              }
            }}
            modalProps={{
              destroyOnClose: true,
            }}
            onOpenChange={(visible) => {
              // 打开表单时预加载当前产品和拉线的详细信息
              if (visible) {
                const { lineId, productId, lineCode, lineName, productCode, productName } = record;
                
                // 对拉线和产品执行空字符搜索，获取选项列表
                handleLineSearch('');
                handleProductSearch('');
                
                // 延迟添加当前编辑项，确保它显示在下拉列表中
                setTimeout(() => {
                  // 检查当前拉线是否在选项中
                  const existingLineOption = searchLineOptions.find(opt => opt.value === lineId);
                  if (!existingLineOption) {
                    setSearchLineOptions(prev => [{
                      label: `${lineCode} - ${lineName}`,
                      value: lineId,
                      lineData: { id: lineId, lineCode, lineName } as Line
                    }, ...prev]);
                  }
                  
                  // 检查当前产品是否在选项中
                  const existingProductOption = searchProductOptions.find(opt => opt.value === productId);
                  if (!existingProductOption) {
                    setSearchProductOptions(prev => [{
                      label: `${productCode} - ${productName}`,
                      value: productId,
                      productData: { id: productId, productCode, productName } as Product
                    }, ...prev]);
                  }
                }, 100);
              }
            }}
          >
            <ProForm.Group>
              <ProFormSelect
                name="lineId"
                label="拉线"
                rules={[{ required: true, message: '请选择拉线' }]}
                width="md"
                showSearch
                placeholder="请输入拉线编号或名称搜索"
                debounceTime={500}
                fieldProps={{
                  showSearch: true,
                  defaultActiveFirstOption: false,
                  filterOption: false,
                  onSearch: handleLineSearch,
                  options: searchLineOptions.map(option => ({
                    label: option.label,
                    value: option.lineData?.id
                  })).filter(opt => opt.value !== undefined),
                  notFoundContent: null,
                  allowClear: true,
                  onClick: () => handleLineSearch(''),
                  loading: searchLineOptions.length === 0,
                  onChange: (value) => {
                    // 根据选择的拉线获取投产日期和工时
                    const selectedLine = searchLineOptions.find(option => option.value === value)?.lineData;
                    if (selectedLine) {
                      // 设置投产日期和工时表单字段
                      formRef.current?.setFieldsValue({
                        lineStartDate: selectedLine.startDate,
                        lineWorksHour: selectedLine.worksHour
                      });
                      
                      // 计算日产能
                      const worksHourCapacity = formRef.current?.getFieldValue('worksHourCapacity');
                      const coefficient = formRef.current?.getFieldValue('coefficient');
                      if (selectedLine.worksHour && worksHourCapacity && coefficient) {
                        const dailyCapacity = (selectedLine.worksHour * worksHourCapacity) * coefficient;
                        formRef.current?.setFieldsValue({
                          dailyCapacity: dailyCapacity.toFixed(2)
                        });
                      }
                    }
                  }
                }}
              />
              <ProFormSelect
                name="productId"
                label="货品"
                rules={[{ required: true, message: '请选择货品' }]}
                width="md"
                showSearch
                placeholder="请输入货品编号或名称搜索"
                debounceTime={500}
                fieldProps={{
                  showSearch: true,
                  defaultActiveFirstOption: false,
                  filterOption: false,
                  onSearch: handleProductSearch,
                  options: searchProductOptions.map(option => ({
                    label: option.label,
                    value: option.productData?.id
                  })).filter(opt => opt.value !== undefined),
                  notFoundContent: null,
                  allowClear: true,
                  onClick: () => handleProductSearch(''),
                  loading: searchProductOptions.length === 0
                }}
              />
            </ProForm.Group>
            <ProForm.Group>
            <ProFormDigit
                name="worksHourCapacity"
                label="工时产能(件/小时)"
                rules={[{ required: true, message: '请输入工时产能' }]}
                min={0}
                width="md"
                fieldProps={{
                  onChange: (value) => {
                    // 重新计算日产能
                    const lineWorksHour = formRef.current?.getFieldValue('lineWorksHour');
                    const coefficient = formRef.current?.getFieldValue('coefficient');
                    if (lineWorksHour && value && coefficient) {
                      const dailyCapacity = (lineWorksHour * value) * coefficient;
                      formRef.current?.setFieldsValue({
                        dailyCapacity: dailyCapacity.toFixed(2)
                      });
                    }
                  }
                }}
              />
              <ProFormDigit
                name="coefficient"
                label="系数"
                rules={[{ required: true, message: '请输入系数' }]}
                min={0}
                max={5}
                initialValue={1.0}
                fieldProps={{
                  precision: 2,
                  step: 0.1,
                  onChange: (value) => {
                    // 重新计算日产能
                    const lineWorksHour = formRef.current?.getFieldValue('lineWorksHour');
                    const worksHourCapacity = formRef.current?.getFieldValue('worksHourCapacity');
                    if (lineWorksHour && worksHourCapacity && value) {
                      const dailyCapacity = (lineWorksHour * worksHourCapacity) * value;
                      formRef.current?.setFieldsValue({
                        dailyCapacity: dailyCapacity.toFixed(2)
                      });
                    }
                  }
                }}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
            <ProFormDatePicker
                name="lineStartDate"
                label="拉线投产日期"
                width="md"
                readonly
                fieldProps={{
                  style: { backgroundColor: '#f5f5f5' }
                }}
              />
              <ProFormDigit
                name="lineWorksHour"
                label="拉线工时(小时/天)"
                width="md"
                readonly
                fieldProps={{
                  style: { backgroundColor: '#f5f5f5' }
                }}
              />
              <ProFormText
                name="dailyCapacity"
                label="日产能(件/天)"
                width="md"
                readonly
                fieldProps={{
                  style: { backgroundColor: '#f5f5f5' }
                }}
                extra={<span style={{ color: '#888' }}>计算公式: (拉线工时 × 工时产能) × 系数</span>}
              />
            </ProForm.Group>
            
            <ProForm.Group>
                <ProFormSwitch
                  name="status"
                  label="状态"
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                  initialValue={true}
                  transform={(value) => ({ status: value ? 1 : 0 })}
                  fieldProps={{
                    defaultChecked: record.status === 1,
                  }}
                />
              </ProForm.Group>
            <ProFormTextArea
              name="remark"
              label="备注"
              width="xl"
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该产能规则吗？"
            onConfirm={async () => {
              try {
                await deleteCapacityRule(record.id!);
                message.success('删除成功');
                actionRef.current?.reload();
              } catch (apiError: any) {
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
    <ProTable<CapacityRule>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      bordered
      defaultSize="small"
      request={async (params = {}, sort, filter) => {
        try {
          // 构建查询参数
          const queryParams: CapacityRulePageRequest = {
            pageNum: params.current as number,
            pageSize: params.pageSize as number,
            ...searchParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };

          const result = await getCapacityRulePage(queryParams);
          setTableData(result.list);
          return {
            data: result.list,
            success: true,
            total: result.total,
          };
        } catch (apiError: any) {
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
        persistenceKey: 'production-capacity-rule-table',
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
      headerTitle={
        <Space>
          <Select
            placeholder="拉线编号/名称"
            style={{ width: 200 }}
            showSearch
            allowClear
            defaultActiveFirstOption={false}
            filterOption={false}
            onSearch={handleLineSearch}
            onChange={(value: number) => {
              setSearchParams(prev => ({ ...prev, lineId: value }));
              actionRef.current?.reload();
            }}
            options={searchLineOptions}
            onClick={() => handleLineSearch('')}
          />
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
        </Space>
      }
      pagination={{
        defaultPageSize: 10,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      dateFormatter="string"
      rowClassName={(record) => {
        return record.id === highlightedRowId ? 'highlight-row' : '';
      }}
      toolBarRender={() => [
        <ModalForm<CapacityRule>
          key="create"
          title="新建产能规则"
          formRef={formRef}
          trigger={
            <Button type="primary">
              <PlusOutlined /> 新建规则
            </Button>
          }
          onFinish={async (values) => {
            try {
              await createCapacityRule(values);
              message.success('创建成功');
              actionRef.current?.reload();
              return true;
            } catch (apiError: any) {
              const errorMessage = apiError.response?.data?.message || apiError.message || '创建失败';
              message.error(errorMessage);
              // 如果是重复记录错误，高亮显示已存在的记录
              if (errorMessage.includes('已存在')) {
                highlightRow(values.lineId, values.productId);
              }
              return false;
            }
          }}
          modalProps={{
            destroyOnClose: true,
          }}
          onOpenChange={(visible) => {
            if (visible) {
              // 预加载选项，使用空搜索获取初始列表
              handleLineSearch('');
              handleProductSearch('');
            }
          }}
        >
          <ProForm.Group>
            <ProFormSelect
              name="lineId"
              label="拉线"
              rules={[{ required: true, message: '请选择拉线' }]}
              width="md"
              showSearch
              placeholder="请输入拉线编号或名称搜索"
              debounceTime={500}
              fieldProps={{
                showSearch: true,
                defaultActiveFirstOption: false,
                filterOption: false,
                onSearch: handleLineSearch,
                options: searchLineOptions.map(option => ({
                  label: option.label,
                  value: option.lineData?.id
                })).filter(opt => opt.value !== undefined),
                notFoundContent: null,
                allowClear: true,
                onClick: () => handleLineSearch(''),
                loading: searchLineOptions.length === 0,
                onChange: (value) => {
                  // 根据选择的拉线获取投产日期和工时
                  const selectedLine = searchLineOptions.find(option => option.value === value)?.lineData;
                  if (selectedLine) {
                    // 设置投产日期和工时表单字段
                    formRef.current?.setFieldsValue({
                      lineStartDate: selectedLine.startDate,
                      lineWorksHour: selectedLine.worksHour
                    });
                    
                    // 计算日产能
                    const worksHourCapacity = formRef.current?.getFieldValue('worksHourCapacity');
                    const coefficient = formRef.current?.getFieldValue('coefficient');
                    if (selectedLine.worksHour && worksHourCapacity && coefficient) {
                      const dailyCapacity = (selectedLine.worksHour * worksHourCapacity) * coefficient;
                      formRef.current?.setFieldsValue({
                        dailyCapacity: dailyCapacity.toFixed(2)
                      });
                    }
                  }
                }
              }}
            />
            <ProFormSelect
              name="productId"
              label="货品"
              rules={[{ required: true, message: '请选择货品' }]}
              width="md"
              showSearch
              placeholder="请输入货品编号或名称搜索"
              debounceTime={500}
              fieldProps={{
                showSearch: true,
                defaultActiveFirstOption: false,
                filterOption: false,
                onSearch: handleProductSearch,
                options: searchProductOptions.map(option => ({
                  label: option.label,
                  value: option.productData?.id
                })).filter(opt => opt.value !== undefined),
                notFoundContent: null,
                allowClear: true,
                onClick: () => handleProductSearch(''),
                loading: searchProductOptions.length === 0
              }}
            />
            
            
          </ProForm.Group>
          <ProForm.Group>
          <ProFormDigit
              name="worksHourCapacity"
              label="工时产能(件/小时)"
              rules={[{ required: true, message: '请输入工时产能' }]}
              min={0}
              width="md"
              fieldProps={{
                onChange: (value) => {
                  // 重新计算日产能
                  const lineWorksHour = formRef.current?.getFieldValue('lineWorksHour');
                  const coefficient = formRef.current?.getFieldValue('coefficient');
                  if (lineWorksHour && value && coefficient) {
                    const dailyCapacity = (lineWorksHour * value) * coefficient;
                    formRef.current?.setFieldsValue({
                      dailyCapacity: dailyCapacity.toFixed(2)
                    });
                  }
                }
              }}
            />
            <ProFormDigit
              name="coefficient"
              label="系数"
              rules={[{ required: true, message: '请输入系数' }]}
              min={0}
              max={5}
              initialValue={1.0}
              fieldProps={{
                precision: 2,
                step: 0.1,
                onChange: (value) => {
                  // 重新计算日产能
                  const lineWorksHour = formRef.current?.getFieldValue('lineWorksHour');
                  const worksHourCapacity = formRef.current?.getFieldValue('worksHourCapacity');
                  if (lineWorksHour && worksHourCapacity && value) {
                    const dailyCapacity = (lineWorksHour * worksHourCapacity) * value;
                    formRef.current?.setFieldsValue({
                      dailyCapacity: dailyCapacity.toFixed(2)
                    });
                  }
                }
              }}
              width="md"
            />
            
          </ProForm.Group>
          <ProForm.Group>
          <ProFormDatePicker
              name="lineStartDate"
              label="拉线投产日期"
              width="md"
              readonly
              fieldProps={{
                style: { backgroundColor: '#f5f5f5' }
              }}
            />
            <ProFormDigit
              name="lineWorksHour"
              label="拉线工时(小时/天)"
              width="md"
              readonly
              fieldProps={{
                style: { backgroundColor: '#f5f5f5' }
              }}
            />
            <ProFormText
              name="dailyCapacity"
              label="日产能(件/天)"
              width="md"
              readonly
              fieldProps={{
                style: { backgroundColor: '#f5f5f5' }
              }}
              extra={<span style={{ color: '#888' }}>计算公式: (拉线工时 × 工时产能) × 系数</span>}
            />
          </ProForm.Group>
          <ProForm.Group>
          <ProFormSwitch
              name="status"
              label="状态"
              checkedChildren="启用"
              unCheckedChildren="禁用"
              initialValue={true}
              transform={(value) => ({ status: value ? 1 : 0 })}
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

export default CapacityRuleManagement; 