import React, { useRef, useState } from 'react';
import {
  Button,
  Space,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Input,
  TreeSelect,
  DatePicker,
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { 
  ProTable,
  ModalForm,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormDigit,
  ProFormTreeSelect,
  ProFormDatePicker,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ApiError } from '../../../services/api';
import {
  Line,
  LinePageRequest,
  LineStatus,
} from '../../../services/line';
import {
  getLinePage,
  createLine,
  updateLine,
  deleteLine,
  updateLineStatus,
} from '../../../services/line';
import { getAllDepartments } from '../../../services/department';
import debounce from 'lodash/debounce';
import LineCoefficient from './LineCoefficient';

const LineManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [treeData, setTreeData] = React.useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<{
    keyword?: string;
    deptId?: number;
  }>({});
  const [coefficientModalVisible, setCoefficientModalVisible] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  // 防抖处理函数
  const handleSearchWithDebounce = debounce((value: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      keyword: value
    }));
    actionRef.current?.reload();
  }, 500);

  // 防抖处理部门选择
  const handleDeptChangeWithDebounce = debounce((value: number | undefined) => {
    setSearchParams(prev => ({ ...prev, deptId: value }));
    actionRef.current?.reload();
  }, 500);

  // 将部门列表转换为TreeSelect需要的数据格式
  const formatTreeSelectData = (data: any[]): any[] => {
    const map = new Map<number, any>();
    const result: any[] = [];

    // 先创建所有节点
    data.forEach(dept => {
      map.set(dept.id, {
        title: dept.name,
        value: dept.id,
        key: dept.id,
        children: [],
      });
    });

    // 构建树形结构
    data.forEach(dept => {
      const node = map.get(dept.id);
      if (dept.parentId === 0) {
        result.push(node);
      } else {
        const parent = map.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // 移除空的 children 数组
    const removeEmptyChildren = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.children.length === 0) {
          const { children, ...rest } = node;
          return rest;
        }
        return {
          ...node,
          children: removeEmptyChildren(node.children),
        };
      });
    };

    return removeEmptyChildren(result);
  };

  // 获取部门树形选择数据
  const fetchTreeSelectData = async () => {
    try {
      const result = await getAllDepartments();
      if (result && Array.isArray(result)) {
        const treeData = formatTreeSelectData(result);
        setTreeData(treeData);
      } else {
        setTreeData([]);
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取部门列表失败');
    }
  };

  // 在组件挂载时获取部门数据
  React.useEffect(() => {
    fetchTreeSelectData();
  }, []);

  // ProTable 列定义
  const columns: ProColumns<Line>[] = [
    {
      title: '拉线编号/名称',
      dataIndex: 'lineCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
      tip: '支持拉线编号或名称模糊搜索',
      render: (_, record) => `${record.lineCode} - ${record.lineName}`,
      width: 200,
    },
    {
      title: '拉线名称',
      dataIndex: 'lineName',
      copyable: true,
      ellipsis: true,
      sorter: true,
      hideInTable: true,
    },
    {
      title: '所属部门',
      dataIndex: 'deptId',
      hideInTable: true,
      renderFormItem: () => (
        <ProFormTreeSelect
          name="deptId"
          placeholder="请选择所属部门"
          fieldProps={{
            treeData,
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
      ),
    },
    {
      title: '所属部门',
      dataIndex: 'deptName',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '投产日期',
      dataIndex: 'startDate',
      valueType: 'date',
      sorter: true,
      search: false,
    },
    {
      title: '工时数(小时)',
      dataIndex: 'worksHour',
      valueType: 'digit',
      sorter: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: true,
      onFilter: true,
      valueType: 'select',
      valueEnum: {
        [LineStatus.ENABLED]: { text: '启用', status: 'Success' },
        [LineStatus.DISABLED]: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === LineStatus.ENABLED}
          onChange={async (checked) => {
            try {
              await updateLineStatus(record.id!, checked ? LineStatus.ENABLED : LineStatus.DISABLED);
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
          <Tooltip title="系数维护">
            <a
              onClick={() => {
                setSelectedLineId(record.id!);
                setCoefficientModalVisible(true);
              }}
            >
              <CalendarOutlined style={{ color: '#1890ff' }} />
            </a>
          </Tooltip>
          <ModalForm<Line>
            title="编辑拉线"
            trigger={
              <Tooltip title="编辑">
                <a><EditOutlined style={{ color: '#1890ff' }} /></a>
              </Tooltip>
            }
            initialValues={record}
            onFinish={async (values) => {
              try {
                const params = {
                  lineCode: values.lineCode,
                  lineName: values.lineName,
                  deptId: values.deptId,
                  startDate: values.startDate,
                  worksHour: values.worksHour,
                  status: values.status ? LineStatus.ENABLED : LineStatus.DISABLED,
                  remark: values.remark,
                };
                await updateLine(record.id!, params);
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
            onOpenChange={(visible) => {
              if (visible) {
                fetchTreeSelectData();
              }
            }}
          >
            <ProForm.Group>
              <ProFormText
                name="lineCode"
                label="拉线编号"
                rules={[{ required: true, message: '请输入拉线编号' }]}
                width="md"
              />
              <ProFormText
                name="lineName"
                label="拉线名称"
                rules={[{ required: true, message: '请输入拉线名称' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormTreeSelect
                name="deptId"
                label="所属部门"
                tooltip="请选择所属部门"
                width="md"
                fieldProps={{
                  treeData,
                  treeDefaultExpandAll: true,
                  showSearch: true,
                  treeNodeFilterProp: 'title',
                  placeholder: '请选择所属部门',
                }}
                rules={[{ required: true, message: '请选择所属部门' }]}
              />
              <ProFormSwitch
                name="status"
                label="状态"
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDatePicker
                name="startDate"
                label="投产日期"
                width="md"
              />
              <ProFormDigit
                name="worksHour"
                label="工时数(小时)"
                width="md"
                min={0}
                max={24}
                fieldProps={{
                  precision: 1,
                  step: 0.5,
                }}
                tooltip="一天工时数(默认24小时)"
                placeholder="请输入工时数"
              />
            </ProForm.Group>
            <ProFormTextArea
              name="remark"
              label="备注"
              width="xl"
            />
          </ModalForm>
          <Popconfirm
            title="确定要删除该拉线吗？"
            onConfirm={async () => {
              try {
                await deleteLine(record.id!);
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
    <>
      <ProTable<Line>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        bordered
        defaultSize="small"
        request={async (params = {}, sort, filter) => {
          try {
            const { current, pageSize, ...restParams } = params;

            // 构建请求参数
            const requestParams: LinePageRequest = {
              pageNum: current || 1,
              pageSize: pageSize || 10,
              ...restParams,
              ...searchParams,
              sortField: Object.keys(sort || {})[0],
              sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
            };

            // 确保移除lineCode和lineName属性，使用keyword替代
            if ('lineCode' in requestParams) {
              delete requestParams.lineCode;
            }
            if ('lineName' in requestParams) {
              delete requestParams.lineName;
            }

            const result = await getLinePage(requestParams);

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
              placeholder="拉线编号/名称"
              onChange={(e) => handleSearchWithDebounce(e.target.value)}
              style={{ width: 300 }}
              allowClear
              onPressEnter={(e) => handleSearchWithDebounce((e.target as HTMLInputElement).value)}
              onClear={() => handleSearchWithDebounce('')}
            />
            <TreeSelect
              placeholder="所属部门"
              style={{ width: 200 }}
              allowClear
              showSearch
              treeData={treeData}
              onChange={(value: number) => {
                handleDeptChangeWithDebounce(value);
              }}
              treeDefaultExpandAll
              treeNodeFilterProp="title"
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
          <ModalForm<Line>
            key="create"
            title="新建拉线"
            trigger={
              <Button type="primary">
                <PlusOutlined />
                新建
              </Button>
            }
            onFinish={async (values) => {
              try {
                const params = {
                  lineCode: values.lineCode,
                  lineName: values.lineName,
                  deptId: values.deptId,
                  startDate: values.startDate,
                  worksHour: values.worksHour,
                  status: values.status ? LineStatus.ENABLED : LineStatus.DISABLED,
                  remark: values.remark,
                };
                await createLine(params);
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
            initialValues={{
              status: true,
            }}
            onOpenChange={(visible) => {
              if (visible) {
                fetchTreeSelectData();
              }
            }}
          >
            <ProForm.Group>
              <ProFormText
                name="lineCode"
                label="拉线编号"
                rules={[{ required: true, message: '请输入拉线编号' }]}
                width="md"
              />
              <ProFormText
                name="lineName"
                label="拉线名称"
                rules={[{ required: true, message: '请输入拉线名称' }]}
                width="md"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormTreeSelect
                name="deptId"
                label="所属部门"
                tooltip="请选择所属部门"
                width="md"
                fieldProps={{
                  treeData,
                  treeDefaultExpandAll: true,
                  showSearch: true,
                  treeNodeFilterProp: 'title',
                  placeholder: '请选择所属部门',
                }}
                rules={[{ required: true, message: '请选择所属部门' }]}
              />
              <ProFormSwitch
                name="status"
                label="状态"
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDatePicker
                name="startDate"
                label="投产日期"
                width="md"
              />
              <ProFormDigit
                name="worksHour"
                label="工时数(小时)"
                width="md"
                min={0}
                max={24}
                fieldProps={{
                  precision: 1,
                  step: 0.5,
                }}
                tooltip="一天工时数(默认24小时)"
                placeholder="请输入工时数"
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
      {selectedLineId && (
        <LineCoefficient
          lineId={selectedLineId}
          visible={coefficientModalVisible}
          onClose={() => {
            setCoefficientModalVisible(false);
            setSelectedLineId(null);
          }}
        />
      )}
    </>
  );
};

export default LineManagement; 