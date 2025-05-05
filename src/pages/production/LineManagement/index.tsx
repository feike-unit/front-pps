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
  ProFormSwitch,
  ProFormDigit,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

const LineManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [treeData, setTreeData] = React.useState<any[]>([]);

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

  // ProTable 列定义
  const columns: ProColumns<Line>[] = [
    {
      title: '下拉线编号',
      dataIndex: 'lineCode',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '下拉线名称',
      dataIndex: 'lineName',
      copyable: true,
      ellipsis: true,
      sorter: true,
    },
    {
      title: '所属部门',
      dataIndex: 'deptName',
      ellipsis: true,
    },
    {
      title: '工位数量',
      dataIndex: 'workstationCount',
      ellipsis: true,
      sorter: true,
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
          <ModalForm<Line>
            title="编辑下拉线"
            trigger={
              <Tooltip title="编辑">
                <Button type="link" icon={<EditOutlined />} />
              </Tooltip>
            }
            initialValues={record}
            onFinish={async (values) => {
              try {
                const params = {
                  lineCode: values.lineCode,
                  lineName: values.lineName,
                  deptId: values.deptId,
                  workstationCount: values.workstationCount,
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
                label="下拉线编号"
                rules={[{ required: true, message: '请输入下拉线编号' }]}
                width="md"
              />
              <ProFormText
                name="lineName"
                label="下拉线名称"
                rules={[{ required: true, message: '请输入下拉线名称' }]}
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
              <ProFormDigit
                name="workstationCount"
                label="工位数量"
                rules={[{ required: true, message: '请输入工位数量' }]}
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
              />
            </ProForm.Group>
          </ModalForm>
          <Popconfirm
            title="确定要删除该下拉线吗？"
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
              <Button type="link" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable<Line>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params = {}, sort) => {
        try {
          const { current, pageSize, ...restParams } = params;
          
          // 构建请求参数
          const requestParams: LinePageRequest = {
            pageNum: current || 1,
            pageSize: pageSize || 10,
            ...restParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          };
          
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
      search={{
        labelWidth: 'auto',
      }}
      pagination={{
        pageSize: 10,
      }}
      dateFormatter="string"
      headerTitle="下拉线管理"
      toolBarRender={() => [
        <ModalForm<Line>
          key="create"
          title="新建下拉线"
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
                workstationCount: values.workstationCount,
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
            workstationCount: 0,
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
              label="下拉线编号"
              rules={[{ required: true, message: '请输入下拉线编号' }]}
              width="md"
            />
            <ProFormText
              name="lineName"
              label="下拉线名称"
              rules={[{ required: true, message: '请输入下拉线名称' }]}
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
            <ProFormDigit
              name="workstationCount"
              label="工位数量"
              rules={[{ required: true, message: '请输入工位数量' }]}
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
            />
          </ProForm.Group>
        </ModalForm>,
      ]}
    />
  );
};

export default LineManagement; 