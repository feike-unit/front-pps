/**
 * 产能日历组件
 * 功能：
 * 1. 展示拉线工作日历
 * 2. 支持新增/编辑/删除工作日历
 * 3. 支持按年份和拉线筛选
 * 4. 支持设置多个工作时间段
 */
import React, {useEffect, useState} from 'react';
import {Card, Button, Modal, Form, Input, DatePicker, InputNumber, message, ConfigProvider, Tooltip, Popconfirm, Select, Space, TimePicker} from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type {Dayjs} from 'dayjs';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { queryCapacityCalendars, createCapacityCalendar, updateCapacityCalendar, deleteCapacityCalendar } from '../../../services/capacityCalendar';
import type { CapacityCalendar, TimeRange } from '../../../services/capacityCalendar';
import { getAllEnabledLines } from '../../../services/line';
import type { Line } from '../../../services/line';

// 配置 dayjs
dayjs.locale('zh-cn');
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const CapacityCalendarPage: React.FC = () => {
    // 组件状态管理
    const [calendars, setCalendars] = useState<CapacityCalendar[]>([]); // 产能日历数据列表
    const [isModalVisible, setIsModalVisible] = useState(false); // 控制模态框显示
    const [form] = Form.useForm(); // 表单实例
    const [editingId, setEditingId] = useState<number | null | undefined>(null); // 当前编辑的ID
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs()); // 当前选中的年份
    const [selectedLineId, setSelectedLineId] = useState<number>(); // 选中的拉线ID
    const [lines, setLines] = useState<Line[]>([]);

    // 获取拉线列表
    useEffect(() => {
        const fetchLines = async () => {
            try {
                const response = await getAllEnabledLines();
                setLines(response);
            } catch (error: any) {
                console.error('获取拉线列表失败:', error);
                message.error(error.response?.data?.message || error.message || '获取拉线列表失败');
            }
        };
        fetchLines();
    }, []);

    // 获取产能日历数据
    const fetchCalendars = async () => {
        try {
            console.log('正在获取产能日历数据:', selectedLineId, currentDate.year());
            const response = await queryCapacityCalendars(selectedLineId, currentDate.year());
            console.log('获取到的产能日历数据:', response);
            setCalendars(response);
        } catch (error: any) {
            console.error('获取产能日历数据失败:', error);
            message.error(error.response?.data?.message || error.message || '获取产能日历数据失败');
            setCalendars([]);
        }
    };

    useEffect(() => {
        console.log('开始获取数据, 选中的拉线:', selectedLineId);
        fetchCalendars();
    }, [currentDate, selectedLineId]);

    // 拉线选择改变
    const handleLineChange = (value: number | undefined) => {
        setSelectedLineId(value);
    };

    // 处理模态框确认操作
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const startDate = dayjs(values.dateRange[0]).format('YYYY-MM-DD');
            const endDate = dayjs(values.dateRange[1]).format('YYYY-MM-DD');
            
            const data = {
                lineId: values.lineId,
                startDate,
                endDate,
                coefficient: values.coefficient,
                remark: values.remark,
                timeRanges: values.timeRanges.map((range: any) => ({
                    startTime: range.timeRange[0].format('HH:mm:ss'),
                    endTime: range.timeRange[1].format('HH:mm:ss'),
                    periodName: range.periodName
                }))
            };

            if (editingId) {
                await updateCapacityCalendar(editingId, data);
            } else {
                await createCapacityCalendar(data);
            }
            
            message.success(editingId ? '更新成功' : '新增成功');
            setIsModalVisible(false);
            await fetchCalendars();
        } catch (error: any) {
            message.error(error.response?.data?.message || error.message || '操作失败');
        }
    };

    // 处理新增按钮点击
    const handleAdd = () => {
        form.resetFields();
        if (selectedLineId) {
            form.setFieldsValue({
                lineId: selectedLineId,
                coefficient: 1.0
            });
        }
        setEditingId(null);
        setIsModalVisible(true);
    };

    // 处理日历日期点击事件
    const handleDateClick = (arg: any) => {
        const existingCalendar = calendars.find(c => 
            dayjs(arg.dateStr).isBetween(c.startDate, c.endDate, 'day', '[]')
        );
        
        if (existingCalendar) {
            form.setFieldsValue({
                lineId: existingCalendar.lineId,
                dateRange: [dayjs(existingCalendar.startDate), dayjs(existingCalendar.endDate)],
                coefficient: existingCalendar.coefficient,
                remark: existingCalendar.remark,
                timeRanges: existingCalendar.timeRanges.map(range => ({
                    timeRange: [dayjs(range.startTime, 'HH:mm:ss'), dayjs(range.endTime, 'HH:mm:ss')],
                    periodName: range.periodName
                }))
            });
            setEditingId(existingCalendar.id);
        } else {
            form.resetFields();
            form.setFieldsValue({
                lineId: selectedLineId,
                dateRange: [dayjs(arg.dateStr), dayjs(arg.dateStr)],
                coefficient: 1.0
            });
            setEditingId(null);
        }
        setIsModalVisible(true);
    };

    // 处理日期选择
    const handleDateSelect = (selectInfo: any) => {
        form.resetFields();
        form.setFieldsValue({
            lineId: selectedLineId,
            dateRange: [dayjs(selectInfo.start), dayjs(selectInfo.end).subtract(1, 'day')],
            coefficient: 1.0
        });
        setEditingId(null);
        setIsModalVisible(true);
    };

    // 将产能日历数据转换为FullCalendar可识别的格式
    const calendarEvents = calendars.map(calendar => {
        console.log('转换日历数据:', calendar);
        return {
            id: calendar.id?.toString(),
            title: `系数: ${calendar.coefficient}`,
            start: calendar.startDate,
            end: dayjs(calendar.endDate).add(1, 'day').format('YYYY-MM-DD'), // FullCalendar的end日期是不包含的
            extendedProps: {
                timeRanges: calendar.timeRanges,
                remark: calendar.remark
            },
            backgroundColor: '#1890ff',
            borderColor: '#1890ff',
            textColor: '#fff',
            allDay: true
        };
    });
    console.log('转换后的日历事件:', calendarEvents);

    return (
        <ConfigProvider locale={zhCN}>
            <Card
                title={
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>产能日历 ({currentDate.year()}年)</span>
                        <div>
                            <Select
                                style={{ width: 200 }}
                                placeholder="选择拉线（可选）"
                                allowClear
                                onChange={handleLineChange}
                                options={lines.map(line => ({
                                    value: line.id,
                                    label: line.lineName
                                }))}
                            />
                            <DatePicker
                                picker="year"
                                value={currentDate}
                                onChange={(date) => date && setCurrentDate(date)}
                                style={{marginRight: 8}}
                            />
                            <Button type="primary" onClick={handleAdd} disabled={!selectedLineId}>
                                新增产能日历
                            </Button>
                        </div>
                    </div>
                }
            >
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
                    initialView="multiMonthYear"
                    multiMonthMaxColumns={4}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    locale="zh-cn"
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    headerToolbar={false}
                    eventContent={(arg) => {
                        const timeRanges = arg.event.extendedProps.timeRanges;
                        const timeRangeText = timeRanges?.map((range: TimeRange) => 
                            `${range.periodName}: ${range.startTime.substring(0, 5)}-${range.endTime.substring(0, 5)}`
                        ).join('\n');
                        
                        return (
                            <Tooltip title={
                                <div>
                                    <div>系数: {arg.event.title.split(': ')[1]}</div>
                                    {timeRangeText && timeRangeText.split('\n').map((text: string, index: number) => (
                                        <div key={index}>{text}</div>
                                    ))}
                                    {arg.event.extendedProps.remark && (
                                        <div>备注: {arg.event.extendedProps.remark}</div>
                                    )}
                                </div>
                            }>
                                <div style={{padding: '2px 4px', borderRadius: 2}}>
                                    {arg.event.title}
                                </div>
                            </Tooltip>
                        );
                    }}
                />

                <Modal
                    title={editingId ? '编辑产能日历' : '新增产能日历'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => setIsModalVisible(false)}
                    width={800}
                    footer={[
                        editingId && (
                            <Popconfirm
                                key="delete"
                                title="确定要删除这条记录吗？"
                                onConfirm={async () => {
                                    try {
                                        await deleteCapacityCalendar(editingId!);
                                        message.success('删除成功');
                                        setIsModalVisible(false);
                                        await fetchCalendars();
                                    } catch (error: any) {
                                        message.error(error.response?.data?.message || error.message || '删除失败');
                                    }
                                }}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button danger>删除</Button>
                            </Popconfirm>
                        ),
                        <Button key="cancel" onClick={() => setIsModalVisible(false)}>取消</Button>,
                        <Button key="submit" type="primary" onClick={handleModalOk}>确定</Button>
                    ].filter(Boolean)}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="lineId"
                            label="拉线"
                            rules={[{required: true, message: '请选择拉线'}]}
                        >
                            <Select
                                options={lines.filter(line => line.status === 1).map(line => ({label: line.lineName, value: line.id}))}
                                disabled={!!editingId}
                            />
                        </Form.Item>
                        <Form.Item
                            name="dateRange"
                            label="日期范围"
                            rules={[{required: true, message: '请选择日期范围'}]}
                        >
                            <RangePicker 
                                style={{width: '100%'}} 
                                disabled={!!editingId}
                            />
                        </Form.Item>
                        <Form.Item
                            name="coefficient"
                            label="产能系数"
                            rules={[
                                {required: true, message: '请输入产能系数'},
                                {type: 'number', min: 0, message: '系数必须大于0'}
                            ]}
                        >
                            <InputNumber style={{width: '100%'}} step={0.1} precision={2} />
                        </Form.Item>
                        
                        <Form.Item
                            label="工作时段"
                            required
                            help="请至少添加一个工作时段"
                        >
                            <Form.List 
                                name="timeRanges" 
                                initialValue={[{}]}
                                rules={[
                                    {
                                        validator: async (_, timeRanges) => {
                                            if (!timeRanges || timeRanges.length < 1) {
                                                return Promise.reject(new Error('请至少添加一个工作时段'));
                                            }
                                        },
                                    },
                                ]}
                            >
                                {(fields, { add, remove }) => (
                                    <div style={{ width: '100%' }}>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ 
                                                display: 'flex', 
                                                marginBottom: 8,
                                                gap: 8,
                                                width: '100%'
                                            }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'periodName']}
                                                    rules={[{ required: true, message: '请输入时段名称' }]}
                                                    style={{ flex: '0 0 200px', marginBottom: 0 }}
                                                >
                                                    <Input placeholder="时段名称" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'timeRange']}
                                                    rules={[{ required: true, message: '请选择时间范围' }]}
                                                    style={{ flex: 1, marginBottom: 0 }}
                                                >
                                                    <TimePicker.RangePicker 
                                                        format="HH:mm" 
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                                {fields.length > 1 && (
                                                    <Button 
                                                        type="text"
                                                        icon={<MinusCircleOutlined />}
                                                        onClick={() => remove(name)}
                                                        style={{ flex: '0 0 32px' }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <Form.Item style={{ marginBottom: 0 }}>
                                            <Button 
                                                type="dashed" 
                                                onClick={() => add()} 
                                                block 
                                                icon={<PlusOutlined />}
                                            >
                                                添加时间段
                                            </Button>
                                        </Form.Item>
                                    </div>
                                )}
                            </Form.List>
                        </Form.Item>
                        <Form.Item name="remark" label="备注">
                            <Input.TextArea />
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </ConfigProvider>
    );
};

export default CapacityCalendarPage;

