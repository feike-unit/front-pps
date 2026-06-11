import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tabs,
    Tooltip,
    Typography,
} from 'antd';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-components';
import type {TableComponents} from 'rc-table/lib/interface';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CaretDownOutlined,
    CaretRightOutlined,
    EyeOutlined,
    PlayCircleOutlined,
    SwapOutlined,
    SyncOutlined
} from '@ant-design/icons';
import api, {ApiError} from '../../../services/api';
import {
    Demand,
    DemandPageRequest,
    DemandStatus,
    getDemandById,
    getDemandPage,
    getScheduledDemands,
    insertOrderDemands,
    schedulerDemandsByTargetDate,
    schedulerDemands,
    syncCallbackQty,
    syncDemands
} from '../../../services/demand';
import debounce from 'lodash/debounce';
import './index.less';
import {getAllEnabledLines, Line} from '../../../services/line';
import {ProductionPlanPageRequest} from "../../../services/productionPlan.ts";
import dayjs from "dayjs";

// 定义状态颜色映射
const statusColorMap: Record<number, string> = {
    [-1]: 'rgba(250, 173, 20, 0.15)',  // 未排产 - 橙色
    [DemandStatus.INCOMPLETE]: 'rgba(24, 144, 255, 0.15)', // 未完成 - 蓝色
    [DemandStatus.COMPLETED]: 'rgba(82, 196, 26, 0.15)',   // 已完成 - 绿色
};

type ScheduleMode = 'month' | 'date';

const DemandManagement: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [expandedKeys, setExpandedKeys] = useState<number[]>([]);

    // 修改 setSearchParams 的初始化，使用保存的查询条件
    const [searchParams, setSearchParams] = useState<{
        productId?: number;
        status?: number;
        deliveryDateStart?: string;
        deliveryDateEnd?: string;
        keyword?: string;
        productKeyword?: string;
    }>(() => {
        // 从 localStorage 中恢复查询条件，如果没有则使用默认值
        const saved = localStorage.getItem('demandManagementSearchParams');
        console.log("demandManagementSearchParams:" + saved);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {status: 0};
            }
        }
        return {status: 0};
    });

    // 状态切换
    const [status] = useState<0 | 1>(0);

    const [singlePlanSearchValue, setSinglePlanSearchValue] = useState<string>('');
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
    const [detailRecord, setDetailRecord] = useState<Demand | null>(null);

    const [selectedRows, setSelectedRows] = useState<Demand[]>([]);
    const [batchPlanModalVisible, setBatchPlanModalVisible] = useState<boolean>(false);
    const [batchPlanForm] = Form.useForm();
    const [singlePlanModalVisible, setSinglePlanModalVisible] = useState<boolean>(false);
    const [currentPlanDemand, setCurrentPlanDemand] = useState<Demand | null>(null);
    const [planForm] = Form.useForm();

    // 插单相关状态
    const [insertOrderModalVisible, setInsertOrderModalVisible] = useState<boolean>(false);
    const [insertOrderLoading, setInsertOrderLoading] = useState<boolean>(false);
    const [insertOrderForm] = Form.useForm();

    // 已排产需求列表
    const [scheduledDemands, setScheduledDemands] = useState<Demand[]>([]);
    const [loadingScheduledDemands] = useState<boolean>(false);

    // 批量排产需求排序列表
    const [sortedPlanList, setSortedPlanList] = useState<Demand[]>([]);
    const [lines, setLines] = useState<Line[]>([]);
    const [singlePlanLoading, setSinglePlanLoading] = useState<boolean>(false);
    const [batchPlanLoading, setBatchPlanLoading] = useState<boolean>(false);
    const [singlePlanMode, setSinglePlanMode] = useState<ScheduleMode>('month');
    const [batchPlanMode, setBatchPlanMode] = useState<ScheduleMode>('month');

    // 获取所有启用的生产线
    const fetchLines = async () => {
        try {
            const data = await getAllEnabledLines();
            setLines(data);
        } catch (error) {
            message.error('获取生产线列表失败');
        }
    };

    useEffect(() => {
        fetchLines();
    }, []);

    // 添加 useEffect 来保存查询条件到 localStorage
    useEffect(() => {
        localStorage.setItem('demandManagementSearchParams', JSON.stringify(searchParams));
    }, [searchParams]);

    // 处理产品关键字搜索
    const handleProductKeywordSearch = debounce((value: string) => {
        setSearchParams(prev => ({
            ...prev,
            productKeyword: value || undefined
        }));
        actionRef.current?.reload();
    }, 500);

    // 处理关键字搜索
    const handleKeywordSearch = debounce((value: string) => {
        setSearchParams(prev => ({
            ...prev,
            keyword: value || undefined
        }));
        actionRef.current?.reload();
    }, 500);

    // 处理打开插单对话框
    const handleOpenInsertOrderModal = async (record: Demand) => {
        setCurrentPlanDemand(record);
        setInsertOrderModalVisible(true);
    };

    // 处理插单提交
    const handleInsertOrderSubmit = async () => {
        try {
            setInsertOrderLoading(true);
            const values = await insertOrderForm.validateFields();
            await insertOrderDemands(
                {
                    demandIds: [currentPlanDemand!.id!],
                    lineId: values.lineId,
                    coefficient: values.coefficient,
                    beforeDemandId: values.beforeDemandId,
                    planMonth: values.planMonth
                }
            );
            message.success('插单成功');
            setInsertOrderModalVisible(false);
            actionRef.current?.reload();
            insertOrderForm.resetFields();
            setCurrentPlanDemand(null);
            setScheduledDemands([]); // 清空已排产需求列表
        } catch (error: any) {
            const apiError = error as ApiError;
            if (error.code === 'ECONNABORTED') {
                message.error('插单请求超时，请稍后重试');
            } else {
                message.error(apiError.response?.data?.message || apiError.message || '插单失败');
            }
        } finally {
            setInsertOrderLoading(false);
        }
    };

    // 在组件卸载时保存查询条件
    useEffect(() => {
        return () => {
            // 组件卸载时保存当前查询条件
            localStorage.setItem('demandManagementSearchParams', JSON.stringify(searchParams));
        };
    }, [searchParams]);

    const handleExportData = async () => {
        const EXPORT_PAGE_SIZE = 10000; // 导出最大条数

        try {
            message.loading('正在导出数据...', 60); // 设置最长加载时间 60s

            // 构建导出参数
            const exportParams: ProductionPlanPageRequest = {
                pageNum: 1,
                pageSize: EXPORT_PAGE_SIZE,
                ...searchParams
            };

            // 通过 axios 的方式直接调用 API，以便获取 headers
            const response = await api.get('/execution/demands/export/wait/excel', {
                params: exportParams,
                responseType: 'blob',
                timeout: 60000 * 5 // 设置超时时间为5分钟
            });

            // 从响应头中获取文件名
            let filename = generateExportFilename();

            // 创建下载链接
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.destroy();
            message.success('导出成功');
        } catch (error) {
            message.destroy();
            console.error('导出失败:', error);
            message.error('导出失败，请重试');
        }
    };

    // 生成导出文件名
    function generateExportFilename(): string {
        const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
        return `待排产订单_${dateStr}.xlsx`;
    }

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
            title: '业务单号',
            dataIndex: 'businessDocNo',
            ellipsis: true,
            copyable: true,
            width: 160,
        },
        {
            title: '客户订单号',
            dataIndex: 'customerOrderDocNo',
            ellipsis: true,
            copyable: true,
            width: 120,
        },
        {
            title: '客户',
            dataIndex: 'customerCode',
            ellipsis: true,
            copyable: true,
            width: 100,
        },
        {
            title: '客户交期',
            dataIndex: 'deliveryDate',
            valueType: 'date',
            sorter: true,
            width: 100,
        },
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
            ellipsis: true,
            width: 240,
        },
        {
            title: '属性',
            dataIndex: 'productType',
            valueType: 'select',
            valueEnum: {
                1: {text: '采购件'},
                2: {text: '自制件'},
                3: {text: '委外件'},
            },
            width: 60,
        },
        {
            title: '订单数',
            dataIndex: 'demandQuantity',
            width: 60,
        },
        {
            title: '生产数',
            dataIndex: 'purgeQuantity',
            width: 60,
        },
        {
            title: '下达数',
            dataIndex: 'issuedQuantity',
            width: 60,
        },
        {
            title: '报工数',
            dataIndex: 'registeredQuantity',
            width: 60,
        },
        {
            title: '完工数',
            dataIndex: 'completionQuantity',
            width: 60,
        },
        {
            title: '备注',
            dataIndex: 'remark',
            ellipsis: true,
            search: false,
            width: 150,
        },
        {
            title: '完工状态',
            dataIndex: 'completionStatus',
            filters: false,
            onFilter: false,
            valueType: 'select',
            valueEnum: {
                [0]: {text: '未完工', status: 'warning'},
                [1]: {text: '已完工', status: 'processing'}
            },
            width: 100,
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            sorter: true,
            width: 150,
        },
        {
            title: '变更前数量',
            dataIndex: 'changePurgeQuantity',
            width: 100,
            hideInTable: status === 0,
        },
        {
            title: '变更状态',
            dataIndex: 'changeStatus',
            filters: true,
            onFilter: true,
            valueType: 'select',
            valueEnum: {
                [-1]: {text: '已删除', status: 'error'},
                [0]: {text: '未变更', status: 'default'},
                [1]: {text: '已减少', status: 'warning'},
                [2]: {text: '已增加', status: 'processing'},
            },
            width: 100,
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
                    {record.status === 0 && (
                        <Tooltip title="排产">
                            <a onClick={() => handleSinglePlan(record)}>
                                <PlayCircleOutlined style={{color: '#1890ff'}}/>
                            </a>
                        </Tooltip>
                    )}
                    {/* 查看详情按钮 */}
                    <Tooltip title="查看详情">
                        <a onClick={() => handleViewDetails(record)}>
                            <EyeOutlined style={{color: '#1890ff'}}/>
                        </a>
                    </Tooltip>
                    {/* 插单按钮 - 只对未完成的需求显示 */}
                    {record.completionStatus === 0 && (
                        <Tooltip title="插单">
                            <a onClick={() => handleOpenInsertOrderModal(record)}>
                                <SwapOutlined style={{color: '#1890ff'}}/>
                            </a>
                        </Tooltip>
                    )}
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

    // 处理单个排产提交
    const handleSinglePlanSubmit = async () => {
        try {
            setSinglePlanLoading(true);
            const values = await planForm.validateFields();
            if (singlePlanMode === 'date') {
                await schedulerDemandsByTargetDate({
                    demandIds: [currentPlanDemand!.id!],
                    lineId: values.lineId,
                    coefficient: values.coefficient,
                    targetPlanDate: values.targetPlanDate,
                    beforeDemandId: values.beforeDemandId
                });
            } else {
                await schedulerDemands(
                    {
                        demandIds: [currentPlanDemand!.id!],
                        lineId: values.lineId,
                        coefficient: values.coefficient,
                        beforeDemandId: values.beforeDemandId,
                        planMonth: values.planMonth
                    }
                );
            }
            message.success('排产成功');
            setSinglePlanModalVisible(false);
            setSinglePlanSearchValue('');
            actionRef.current?.reload();
            planForm.resetFields();
            setCurrentPlanDemand(null);
        } catch (error: any) {
            const apiError = error as ApiError;
            if (error.code === 'ECONNABORTED') {
                message.error('排产请求超时，请稍后重试');
            } else {
                message.error(apiError.response?.data?.message || apiError.message || '排产失败');
            }
        } finally {
            setSinglePlanLoading(false);
            setSinglePlanSearchValue('');
        }
    };

    // 处理批量排产
    const handleBatchPlan = async () => {
        try {
            setBatchPlanLoading(true);
            const values = await batchPlanForm.validateFields();
            const demandIds = sortedPlanList.map(row => row.id!);
            if (batchPlanMode === 'date') {
                await schedulerDemandsByTargetDate({
                    demandIds,
                    lineId: values.lineId,
                    coefficient: values.coefficient,
                    targetPlanDate: values.targetPlanDate,
                    beforeDemandId: values.beforeDemandId
                });
            } else {
                await schedulerDemands(
                    {
                        demandIds,
                        lineId: values.lineId,
                        coefficient: values.coefficient,
                        beforeDemandId: values.beforeDemandId,
                        planMonth: values.planMonth
                    }
                );
            }

            setBatchPlanModalVisible(false);
            setSelectedRows([]);
            setSortedPlanList([]);
            setScheduledDemands([]);
            message.success('批量排产成功');
            actionRef.current?.clearSelected();
        } catch (error: any) {
            const apiError = error as ApiError;
            if (error.code === 'ECONNABORTED') {
                message.error('批量排产请求超时，请稍后重试');
            } else {
                message.error(apiError.response?.data?.message || apiError.message || '批量排产失败');
            }
        } finally {
            setBatchPlanLoading(false);
        }
    };

    // 处理单个排产
    const handleSinglePlan = async (record: Demand) => {
        setCurrentPlanDemand(record);
        setSinglePlanModalVisible(true);
    };

    // 处理需求排序 - 上移
    const handleMoveUp = (index: number) => {
        if (index === 0) return; // 已经是第一个，无法上移

        const newList = [...sortedPlanList];
        const temp = newList[index];
        newList[index] = newList[index - 1];
        newList[index - 1] = temp;
        setSortedPlanList(newList);
    };

    // 处理需求排序 - 下移
    const handleMoveDown = (index: number) => {
        if (index === sortedPlanList.length - 1) return; // 已经是最后一个，无法下移

        const newList = [...sortedPlanList];
        const temp = newList[index];
        newList[index] = newList[index + 1];
        newList[index + 1] = temp;
        setSortedPlanList(newList);
    };

    // 加载已排产需求列表
    const loadScheduledDemands = debounce(async (lineId: number, planMonth?: string, keyword?: string, planDateStart?: string) => {
        try {
            setScheduledDemands(await getScheduledDemands(lineId, planMonth, keyword, planDateStart));
        } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.response?.data?.message || apiError.message || '获取已排产需求列表失败');
        }
    }, 200);

    const handleScheduleModeChange = (mode: ScheduleMode, form: typeof planForm | typeof batchPlanForm) => {
        form.setFieldValue('beforeDemandId', undefined);
        if (mode === 'date') {
            form.setFieldValue('planMonth', undefined);
            setSinglePlanSearchValue('');
            return;
        }
        form.setFieldValue('targetPlanDate', undefined);
    };

    const renderScheduleModeTabs = (mode: ScheduleMode, onChange: (value: ScheduleMode) => void) => (
        <Tabs
            activeKey={mode}
            onChange={(value) => onChange(value as ScheduleMode)}
            items={[
                { key: 'month', label: '指定月份' },
                { key: 'date', label: '指定日期' }
            ]}
            style={{ marginBottom: 16 }}
        />
    );

    const renderTargetDateMark = (demand: Demand) => (
        demand.targetDateMark === 1 ? (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '1px solid #1677ff',
                    color: '#1677ff',
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: '20px',
                }}
            >
                指
            </span>
        ) : null
    );

    const renderScheduledDemandOption = (demand: Demand) => (
        <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 130px minmax(220px, 1fr) 170px',
                    gap: 8,
                    alignItems: 'center',
                    minWidth: 620,
            }}
        >
            <span>{demand.lineSortNo}</span>
            <span>{demand.businessDocNo}</span>
            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {demand.productName}
            </span>
            <Space size={6}>
                <span>{demand.completionTime ? demand.completionTime.substring(0, 16) : '-'}</span>
                {renderTargetDateMark(demand)}
            </Space>
        </div>
    );

    const renderSchedulePositionField = (form: typeof planForm | typeof batchPlanForm, mode: ScheduleMode) => {
        return (
            <Form.Item
                name="beforeDemandId"
                label="排产位置"
                extra={mode === 'date'
                    ? '选择或输入搜索要排在哪个需求之前；不选择时系统会从所选日期当天可用空档自动切入'
                    : '选择或输入搜索要排在哪个需求之前，不选择则排在最后'}
            >
                <Select
                    placeholder="请选择或输入搜索要排在哪个需求之前"
                    style={{width: '100%'}}
                    popupMatchSelectWidth={720}
                    showSearch
                    options={scheduledDemands.map(demand => ({
                        label: renderScheduledDemandOption(demand),
                        value: demand.id
                    }))}
                    disabled={!form.getFieldValue('lineId') || loadingScheduledDemands}
                    filterOption={false}
                    loading={loadingScheduledDemands}
                    allowClear
                    onInputKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                            const lineId = form.getFieldValue('lineId');
                            if (lineId) {
                                const planMonth = mode === 'month' ? form.getFieldValue('planMonth') : undefined;
                                const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                const targetPlanDate = mode === 'date' ? form.getFieldValue('targetPlanDate') : undefined;
                                const targetPlanDateStr = targetPlanDate ? dayjs(targetPlanDate).format('YYYY-MM-DD') : undefined;
                                loadScheduledDemands(lineId, planMonthStr, singlePlanSearchValue, targetPlanDateStr);
                            }
                        }
                    }}
                    searchValue={singlePlanSearchValue}
                    onSearch={(value) => {
                        setSinglePlanSearchValue(value);
                    }}
                />
            </Form.Item>
        );
    };

    return (
        <>
            <ProTable<Demand>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                bordered
                defaultSize="small"
                scroll={{x: 'max-content'}}
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
                        <Input
                            placeholder="产品编码/产品名称"
                            style={{width: 160}}
                            value={ searchParams.productKeyword || undefined }
                            allowClear
                            onPressEnter={(e) => handleProductKeywordSearch((e.target as HTMLInputElement).value)}
                            onClear={() => handleProductKeywordSearch('')}
                        />
                        <DatePicker.RangePicker
                            placeholder={['开始交期', '结束交期']}
                            style={{width: 220}}
                            value={[
                                searchParams.deliveryDateStart ? dayjs(searchParams.deliveryDateStart) : undefined,
                                searchParams.deliveryDateEnd ? dayjs(searchParams.deliveryDateEnd) : undefined
                            ]}
                            onChange={(dates) => {
                                // 只有当两个日期都选择了，才设置日期区间参数
                                if (dates && dates[0] && dates[1]) {
                                    const startDate = dates[0]?.format('YYYY-MM-DD');
                                    const endDate = dates[1]?.format('YYYY-MM-DD');

                                    if (startDate && endDate) {
                                        setSearchParams(prev => ({
                                            ...prev,
                                            deliveryDateStart: startDate,
                                            deliveryDateEnd: endDate
                                        }));
                                    }
                                } else {
                                    // 如果没有选择完整的日期区间，则清空所有日期参数
                                    setSearchParams(prev => ({
                                        ...prev,
                                        deliveryDateStart: undefined,
                                        deliveryDateEnd: undefined
                                    }));
                                }
                                actionRef.current?.reload();
                            }}
                            allowClear
                        />
                        <Input
                            placeholder="业务单号/客户订单号/客户编号/名称"
                            style={{width: 200}}
                            value={ searchParams.keyword || undefined }
                            allowClear
                            onPressEnter={(e) => handleKeywordSearch((e.target as HTMLInputElement).value)}
                            onClear={() => handleKeywordSearch('')}
                        />
                    </Space>
                }
                request={async (params = {}, sort) => {
                    try {
                        const {current, pageSize, ...restParams} = params;

                        // 如果没有排序参数，则使用默认的交期倒序排序
                        const sortParams = Object.keys(sort || {}).length > 0
                            ? {
                                sortField: Object.keys(sort)[0],
                                sortOrder: Object.values(sort)[0] === 'ascend' ? 'asc' : 'desc'
                            }
                            : {
                                sortField: 'deliveryDate',
                                sortOrder: 'asc'
                            };

                        const pageParams: DemandPageRequest = {
                            pageNum: current || 1,
                            pageSize: pageSize || 100,
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
                    defaultPageSize: 100,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                }}
                dateFormatter="string"
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
                    expandIcon: ({expanded, onExpand, record}) => {
                        if (record.children && record.children.length > 0) {
                            return expanded ? (
                                <CaretDownOutlined onClick={e => onExpand(record, e)}/>
                            ) : (
                                <CaretRightOutlined onClick={e => onExpand(record, e)}/>
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
                        setSortedPlanList(selectedRows); // 同时更新排序列表
                    },
                    getCheckboxProps: (record) => ({
                        disabled: record.status !== 0, // 只允许选择未排产的记录
                    }),
                }}
                tableAlertRender={({selectedRowKeys, onCleanSelected}) => (
                    <Space size={24}>
                        <Alert
                            message={
                                <Space>
                                    已选择 <a style={{fontWeight: 600}}>{selectedRowKeys.length}</a> 项
                                    <a style={{marginLeft: 8}} onClick={onCleanSelected}>
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
                        key="clearFilters"
                        onClick={() => {
                            // 清除所有查询条件
                            localStorage.removeItem('demandManagementSearchParams');
                            // 清除表单中的输入值
                            setSearchParams({ status: 0 });
                            if (actionRef.current) {
                                actionRef.current.reload();
                            }
                        }}
                    >
                        清除条件
                    </Button>,
                    /*<Button
                        key="initDemands"
                        onClick={() => {
                          // 创建日期选择器弹窗
                          let syncDate: string | undefined;
                          Modal.confirm({
                            title: '初始化需求',
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
                                message.error('请选择产能日历开始日期');
                                return Promise.reject('请选择产能日历开始日期');
                              }

                              try {
                                await initDemands(syncDate);
                                message.success('初始化需求成功');
                                actionRef.current?.reload();
                              } catch (error) {
                                const apiError = error as ApiError;
                                message.error(apiError.response?.data?.message || apiError.message || '初始化需求失败');
                              }
                            }
                          });
                        }}
                    >
                      <SyncOutlined />
                      初始化需求
                    </Button>,*/
                    <Button
                        key="syncDemands"
                        onClick={() => {
                            // 创建日期选择器弹窗
                            let syncDate: string | undefined = dayjs().format('YYYY-MM-DD');
                            Modal.confirm({
                                title: '同步需求',
                                content: (
                                    <div style={{marginTop: 16}}>
                                        <span style={{color: '#ff4d4f'}}>* </span>
                                        <span>选择同步日期：</span>
                                        <DatePicker
                                            defaultValue={dayjs()}
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
                                        await syncDemands(syncDate);
                                        message.success('同步需求成功');
                                        actionRef.current?.reload();
                                    } catch (error) {
                                        const apiError = error as ApiError;
                                        message.error(apiError.response?.data?.message || apiError.message || '同步需求失败');
                                    }
                                }
                            });
                        }}
                    >
                        <SyncOutlined/>
                        同步需求
                    </Button>,
                    <Button
                        key="syncCallbackQty"
                        onClick={() => {
                            // 创建日期选择器弹窗
                            let syncDate: string | undefined = dayjs().format('YYYY-MM-DD');
                            Modal.confirm({
                                title: '同步erp完工数信息',
                                content: (
                                    <div style={{marginTop: 16}}>
                                        <span style={{color: '#ff4d4f'}}>* </span>
                                        <span>选择同步日期：</span>
                                        <DatePicker
                                            defaultValue={dayjs()}
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
                                        await syncCallbackQty(syncDate);
                                        message.success('同步成功');
                                        actionRef.current?.reload();
                                    } catch (error) {
                                        const apiError = error as ApiError;
                                        message.error(apiError.response?.data?.message || apiError.message || '同步失败');
                                    }
                                }
                            });
                        }}
                    >
                        <SyncOutlined/>
                        同步完工数
                    </Button>,
                    <Button
                        key="export"
                        onClick={handleExportData}
                    >
                        导出
                    </Button>,
                ]}
            />
            <Modal
                title="插单计划"
                open={insertOrderModalVisible}
                onCancel={() => {
                    if (!insertOrderLoading) {
                        setInsertOrderModalVisible(false);
                        insertOrderForm.resetFields();
                        setCurrentPlanDemand(null);
                        setScheduledDemands([]); // 清空已排产需求列表
                    }
                }}
                maskClosable={!insertOrderLoading}
                closable={!insertOrderLoading}
                footer={[
                    <Button
                        key="cancel"
                        disabled={insertOrderLoading}
                        onClick={() => {
                            setInsertOrderModalVisible(false);
                            insertOrderForm.resetFields();
                            setCurrentPlanDemand(null);
                            setScheduledDemands([]); // 清空已排产需求列表
                        }}
                    >
                        取消
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={insertOrderLoading}
                        disabled={insertOrderLoading}
                        onClick={handleInsertOrderSubmit}
                    >
                        确认插单
                    </Button>
                ]}
                width={600}
            >
                <Spin spinning={insertOrderLoading} tip="正在插单中...">
                    {currentPlanDemand && (
                        <>
                            <Alert
                                message={`正在为货品"${currentPlanDemand.productCode} - ${currentPlanDemand.productName}"进行插单`}
                                type="info"
                                showIcon
                                style={{marginBottom: 24}}
                            />

                            <Form form={insertOrderForm} layout="vertical">
                                <Form.Item
                                    name="lineId"
                                    label="生产拉线"
                                    rules={[
                                        {
                                            validator: async (_, value) => {
                                                if (currentPlanDemand?.productType === 2 && !value) { // 2 表示自制件
                                                    throw new Error('自制件必须选择生产拉线');
                                                }
                                            },
                                        }
                                    ]}
                                >
                                    <Select
                                        placeholder={currentPlanDemand?.productType === 2 ? "自制件必须选择生产拉线" : "请选择生产拉线"}
                                        style={{width: '100%'}}
                                        options={lines.map(line => ({
                                            label: `${line.lineName} (${line.lineCode})`,
                                            value: line.id
                                        }))}
                                        onChange={(value) => {
                                            if (value) {
                                                const planMonth = insertOrderForm.getFieldValue('planMonth');
                                                const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                                loadScheduledDemands(value, planMonthStr);
                                                insertOrderForm.setFieldValue('beforeDemandId', undefined);
                                            } else {
                                                setScheduledDemands([]);
                                            }
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="planMonth"
                                    label="插单月份"
                                >
                                    <DatePicker
                                        picker="month"
                                        style={{width: '100%'}}
                                        placeholder="请选择插单月份"
                                        format="YYYY-MM"
                                        value={dayjs(0)}
                                        onChange={(date) => {
                                            const lineId = insertOrderForm.getFieldValue('lineId');
                                            if (lineId) {
                                                const planMonthStr = date ? dayjs(date).format('YYYY-MM') : undefined;
                                                loadScheduledDemands(lineId, planMonthStr);
                                                insertOrderForm.setFieldValue('beforeDemandId', undefined);
                                            }
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="coefficient"
                                    label="产能系数"
                                    initialValue={1}
                                    rules={[
                                        {required: true, message: '请输入产能系数'},
                                        {type: 'number', min: 0, message: '产能系数必须大于0'}
                                    ]}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        placeholder="请输入产能系数"
                                        precision={2}
                                        step={0.1}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="beforeDemandId"
                                    label="插单位置"
                                    extra="选择或输入搜索要排在哪个需求之前，不选择则排在最后"
                                >
                                    <Select
                                        placeholder="请选择或输入搜索要排在哪个需求之前"
                                        style={{width: '100%'}}
                                        popupMatchSelectWidth={720}
                                        showSearch
                                        options={scheduledDemands.map(demand => ({
                                            label: renderScheduledDemandOption(demand),
                                            value: demand.id
                                        }))}
                                        disabled={!insertOrderForm.getFieldValue('lineId') || loadingScheduledDemands}
                                        filterOption={false}
                                        loading={loadingScheduledDemands}
                                        allowClear
                                        onInputKeyDown={(e) => {
                                            e.stopPropagation();
                                            if (e.key === 'Enter') {
                                                const lineId = insertOrderForm.getFieldValue('lineId');
                                                if (lineId) {
                                                    const planMonth = insertOrderForm.getFieldValue('planMonth');
                                                    const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                                    loadScheduledDemands(lineId, planMonthStr, singlePlanSearchValue);
                                                }
                                            }
                                        }}
                                        searchValue={singlePlanSearchValue}
                                        onSearch={(value) => {
                                            setSinglePlanSearchValue(value);
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </>
                    )}
                </Spin>
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
                    <div style={{maxHeight: '70vh', overflowY: 'auto'}}>
                        {/* 根需求信息表单 */}
                        <Card title="基本信息" bordered={false} style={{marginBottom: 16}}>
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
                                        <div className="label">下达数量</div>
                                        <div className="value">{detailRecord.registeredQuantity}</div>
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
                                        <div className="label">上线时间</div>
                                        <div className="value">{detailRecord.onlineTime || '-'}</div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="detail-item">
                                        <div className="label">状态</div>
                                        <div className="value">
                                            <Badge
                                                color={
                                                    detailRecord.completionStatus === 0 ? '#1890ff' :
                                                        detailRecord.completionStatus === 1 ? '#52c41a' : '#000'
                                                }
                                                text={
                                                    detailRecord.completionStatus === 0 ? '未完成' :
                                                        detailRecord.completionStatus === 1 ? '已完成' : '-'
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
                                            <Typography.Text
                                                copyable>{detailRecord.customerOrderDocNo}</Typography.Text>
                                        </div>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div className="detail-item">
                                        <div className="label">客户</div>
                                        <div className="value">{detailRecord.customerCode}</div>
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
                                            title: '数量',
                                            dataIndex: 'purgeQuantity',
                                            key: 'purgeQuantity',
                                            width: 100,
                                        },
                                        {
                                            title: '完成数量',
                                            dataIndex: 'completionQuantity',
                                            key: 'completionQuantity',
                                            width: 100,
                                        },
                                        {
                                            title: '客户交期',
                                            dataIndex: 'deliveryDate',
                                            key: 'deliveryDate',
                                            width: 120,
                                        }
                                    ]}
                                    size="small"
                                    pagination={false}
                                    rowKey="id"
                                    expandable={{
                                        defaultExpandAllRows: true,
                                        expandIcon: ({expanded, onExpand, record}) => {
                                            if (record.children && record.children.length > 0) {
                                                return expanded ? (
                                                    <CaretDownOutlined onClick={e => onExpand(record, e)}/>
                                                ) : (
                                                    <CaretRightOutlined onClick={e => onExpand(record, e)}/>
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
                    if (!batchPlanLoading) {
                        setBatchPlanModalVisible(false);
                        setSortedPlanList([]); // 清空排序列表
                        batchPlanForm.resetFields();
                        setScheduledDemands([]); // 清空已排产需求列表
                        setSinglePlanSearchValue('');
                        actionRef.current?.clearSelected();
                    }
                }}
                maskClosable={!batchPlanLoading}
                closable={!batchPlanLoading}
                footer={[
                    <Button
                        key="cancel"
                        disabled={batchPlanLoading}
                        onClick={() => {
                            setBatchPlanModalVisible(false);
                            setSortedPlanList([]); // 清空排序列表
                            batchPlanForm.resetFields();
                            setScheduledDemands([]); // 清空已排产需求列表
                            setSinglePlanSearchValue('');
                            actionRef.current?.clearSelected();
                        }}
                    >
                        取消
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={batchPlanLoading}
                        disabled={batchPlanLoading}
                        onClick={handleBatchPlan}
                    >
                        确认排产
                    </Button>
                ]}
                width={800}
            >
                <Spin spinning={batchPlanLoading} tip="正在批量排产中...">
                    <Alert
                        message={`已选择 ${sortedPlanList.length} 个未排产需求进行批量排产，可拖拽调整排产顺序`}
                        type="info"
                        showIcon
                        style={{marginBottom: 24}}
                    />

                    <div style={{marginBottom: 24}}>
                        <Typography.Text type="warning">
                            注意：系统将根据选择的拉线和排产位置自动安排排产计划。
                        </Typography.Text>
                    </div>

                    <Form form={batchPlanForm} layout="vertical">
                        {renderScheduleModeTabs(batchPlanMode, (mode) => {
                            setBatchPlanMode(mode);
                            handleScheduleModeChange(mode, batchPlanForm);
                        })}
                        <Form.Item
                            name="lineId"
                            label="生产拉线"
                            rules={[
                                {
                                    validator: async (_, value) => {
                                        // 检查选中的需求中是否有自制件
                                        const hasSelfMade = sortedPlanList.some(demand => demand.productType === 2);
                                        if (hasSelfMade && !value) {
                                            throw new Error('包含自制件的需求必须选择生产拉线');
                                        }
                                    },
                                }
                            ]}
                        >
                            <Select
                                placeholder={sortedPlanList.some(demand => demand.productType === 2) ?
                                    "包含自制件必须选择生产拉线" : "请选择生产拉线"}
                                style={{width: '100%'}}
                                options={lines.map(line => ({
                                    label: `${line.lineName} (${line.lineCode})`,
                                    value: line.id
                                }))}
                                onChange={(value) => {
                                    if (value) {
                                        const planMonth = batchPlanMode === 'month' ? batchPlanForm.getFieldValue('planMonth') : undefined;
                                        const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                        const targetPlanDate = batchPlanMode === 'date' ? batchPlanForm.getFieldValue('targetPlanDate') : undefined;
                                        const targetPlanDateStr = targetPlanDate ? dayjs(targetPlanDate).format('YYYY-MM-DD') : undefined;
                                        loadScheduledDemands(value, planMonthStr, undefined, targetPlanDateStr);
                                        batchPlanForm.setFieldValue('beforeDemandId', undefined);
                                    } else {
                                        setScheduledDemands([]);
                                    }
                                }}
                            />
                        </Form.Item>
                        {batchPlanMode === 'month' ? (
                            <Form.Item
                                name="planMonth"
                                label="排产月份"
                            >
                                <DatePicker
                                    picker="month"
                                    style={{width: '100%'}}
                                    placeholder="请选择排产月份"
                                    format="YYYY-MM"
                                    onChange={(date) => {
                                        const lineId = batchPlanForm.getFieldValue('lineId');
                                        if (lineId) {
                                            const planMonthStr = date ? dayjs(date).format('YYYY-MM') : undefined;
                                            loadScheduledDemands(lineId, planMonthStr);
                                            batchPlanForm.setFieldValue('beforeDemandId', undefined);
                                        }
                                    }}
                                />
                            </Form.Item>
                        ) : (
                            <Form.Item
                                name="targetPlanDate"
                                label="排到日期"
                                rules={[{ required: true, message: '请选择排产日期' }]}
                            >
                                <DatePicker
                                    style={{width: '100%'}}
                                    placeholder="请选择排产日期"
                                    format="YYYY-MM-DD"
                                    onChange={() => {
                                        const lineId = batchPlanForm.getFieldValue('lineId');
                                        if (lineId) {
                                            const targetPlanDate = batchPlanForm.getFieldValue('targetPlanDate');
                                            const targetPlanDateStr = targetPlanDate ? dayjs(targetPlanDate).format('YYYY-MM-DD') : undefined;
                                            loadScheduledDemands(lineId, undefined, undefined, targetPlanDateStr);
                                            batchPlanForm.setFieldValue('beforeDemandId', undefined);
                                        }
                                    }}
                                />
                            </Form.Item>
                        )}
                        <Form.Item
                            name="coefficient"
                            label="产能系数"
                            initialValue={1}
                            rules={[
                                {required: true, message: '请输入产能系数'},
                                {type: 'number', min: 0, message: '产能系数必须大于0'}
                            ]}
                        >
                            <InputNumber
                                style={{width: '100%'}}
                                placeholder="请输入产能系数"
                                precision={2}
                                step={0.1}
                            />
                        </Form.Item>
                        {renderSchedulePositionField(batchPlanForm, batchPlanMode)}
                    </Form>

                    {/* 显示选中的需求列表 */}
                    <Table
                        dataSource={sortedPlanList}
                        columns={[
                            {
                                title: '序号',
                                width: 60,
                                render: (_, record, index) => index + 1,
                            },
                            {
                                title: '货品编号/名称',
                                dataIndex: 'productCode',
                                render: (_, record) => `${record.productCode} - ${record.productName}`,
                            },
                            {
                                title: '订单数量',
                                dataIndex: 'demandQuantity',
                                width: 100,
                            },
                            {
                                title: '客户交期',
                                dataIndex: 'deliveryDate',
                                width: 120,
                            },
                            {
                                title: '操作',
                                width: 80,
                                render: (_, record, index) => (
                                    <Space size="small">
                                        <Tooltip title="上移">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<ArrowUpOutlined/>}
                                                disabled={index === 0}
                                                onClick={() => handleMoveUp(index)}
                                            />
                                        </Tooltip>
                                        <Tooltip title="下移">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<ArrowDownOutlined/>}
                                                disabled={index === sortedPlanList.length - 1}
                                                onClick={() => handleMoveDown(index)}
                                            />
                                        </Tooltip>
                                    </Space>
                                ),
                            }
                        ]}
                        size="small"
                        pagination={false}
                        scroll={{y: 300}}
                        expandable={{
                            showExpandColumn: false
                        }}
                        rowKey="id"
                    />
                </Spin>
            </Modal>

            {/* 单个排产对话框 */}
            <Modal
                title="排产计划"
                open={singlePlanModalVisible}
                onCancel={() => {
                    if (!singlePlanLoading) {
                        setSinglePlanModalVisible(false);
                        planForm.resetFields();
                        setSinglePlanSearchValue('');
                        setCurrentPlanDemand(null);
                        setScheduledDemands([]); // 清空已排产需求列表
                    }
                }}
                maskClosable={!singlePlanLoading}
                closable={!singlePlanLoading}
                footer={[
                    <Button
                        key="cancel"
                        disabled={singlePlanLoading}
                        onClick={() => {
                            setSinglePlanModalVisible(false);
                            planForm.resetFields();
                            setCurrentPlanDemand(null);
                            setSinglePlanSearchValue('');
                            setScheduledDemands([]); // 清空已排产需求列表
                        }}
                    >
                        取消
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={singlePlanLoading}
                        disabled={singlePlanLoading}
                        onClick={handleSinglePlanSubmit}
                    >
                        确认排产
                    </Button>
                ]}
                width={600}
            >
                <Spin spinning={singlePlanLoading} tip="正在排产中...">
                    {currentPlanDemand && (
                        <>
                            <Alert
                                message={`正在为货品"${currentPlanDemand.productCode} - ${currentPlanDemand.productName}"进行排产`}
                                type="info"
                                showIcon
                                style={{marginBottom: 24}}
                            />

                            <Form form={planForm} layout="vertical">
                                {renderScheduleModeTabs(singlePlanMode, (mode) => {
                                    setSinglePlanMode(mode);
                                    handleScheduleModeChange(mode, planForm);
                                })}
                                <Form.Item
                                    name="lineId"
                                    label="生产拉线"
                                    rules={[
                                        {
                                            required: true, message: '请选择生产拉线',
                                            validator: async (_, value) => {
                                                if (currentPlanDemand?.productType === 2 && !value) { // 2 表示自制件
                                                    throw new Error('自制件必须选择生产拉线');
                                                }
                                            },
                                        }
                                    ]}
                                >
                                    <Select
                                        placeholder={currentPlanDemand?.productType === 2 ? "自制件必须选择生产拉线" : "请选择生产拉线"}
                                        style={{width: '100%'}}
                                        options={lines.map(line => ({
                                            label: `${line.lineName} (${line.lineCode})`,
                                            value: line.id
                                        }))}
                                        onChange={(value) => {
                                            if (value) {
                                                const planMonth = singlePlanMode === 'month' ? planForm.getFieldValue('planMonth') : undefined;
                                                const planMonthStr = planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined;
                                                const targetPlanDate = singlePlanMode === 'date' ? planForm.getFieldValue('targetPlanDate') : undefined;
                                                const targetPlanDateStr = targetPlanDate ? dayjs(targetPlanDate).format('YYYY-MM-DD') : undefined;
                                                loadScheduledDemands(value, planMonthStr, undefined, targetPlanDateStr);
                                                planForm.setFieldValue('beforeDemandId', undefined);
                                            } else {
                                                setScheduledDemands([]);
                                            }
                                        }}
                                    />
                                </Form.Item>
                                {singlePlanMode === 'month' ? (
                                    <Form.Item
                                        name="planMonth"
                                        label="排产月份"
                                    >
                                        <DatePicker
                                            picker="month"
                                            style={{width: '100%'}}
                                            placeholder="请选择排产月份"
                                            format="YYYY-MM"
                                            onChange={(date) => {
                                                const lineId = planForm.getFieldValue('lineId');
                                                if (lineId) {
                                                    const planMonthStr = date ? dayjs(date).format('YYYY-MM') : undefined;
                                                    loadScheduledDemands(lineId, planMonthStr);
                                                    planForm.setFieldValue('beforeDemandId', undefined);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                ) : (
                                    <Form.Item
                                        name="targetPlanDate"
                                        label="排到日期"
                                        rules={[{ required: true, message: '请选择排产日期' }]}
                                    >
                                        <DatePicker
                                            style={{width: '100%'}}
                                            placeholder="请选择排产日期"
                                            format="YYYY-MM-DD"
                                            onChange={() => {
                                                const lineId = planForm.getFieldValue('lineId');
                                                if (lineId) {
                                                    const targetPlanDate = planForm.getFieldValue('targetPlanDate');
                                                    const targetPlanDateStr = targetPlanDate ? dayjs(targetPlanDate).format('YYYY-MM-DD') : undefined;
                                                    loadScheduledDemands(lineId, undefined, undefined, targetPlanDateStr);
                                                    planForm.setFieldValue('beforeDemandId', undefined);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                )}
                                <Form.Item
                                    name="coefficient"
                                    label="产能系数"
                                    initialValue={1}
                                    rules={[
                                        {required: true, message: '请输入产能系数'},
                                        {type: 'number', min: 0, message: '产能系数必须大于0'}
                                    ]}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        placeholder="请输入产能系数"
                                        precision={2}
                                        step={0.1}
                                    />
                                </Form.Item>
                                {renderSchedulePositionField(planForm, singlePlanMode)}
                            </Form>

                            <div style={{marginTop: 16}}>
                                <Typography.Text type="warning">
                                    注意：系统将根据选择的拉线和排产位置自动安排排产计划。
                                </Typography.Text>
                            </div>
                        </>
                    )}
                </Spin>
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
