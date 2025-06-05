/**
 * 产能日历组件
 * 功能：
 * 1. 展示拉线工作日历
 * 2. 支持新增/编辑/删除工作日历
 * 3. 支持按年月和拉线筛选
 */
import React, {useEffect, useState} from 'react';
import {Card, Button, Modal, Form, Input, DatePicker, InputNumber, message, ConfigProvider, Tooltip, Popconfirm, Select, TimePicker} from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type {Dayjs} from 'dayjs';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import { queryCapacityCalendars, createCapacityCalendar, updateCapacityCalendar, deleteCapacityCalendar } from '../../../services/capacityCalendar';
import type { CapacityCalendar } from '../../../services/capacityCalendar';
import { getAllEnabledLines } from '../../../services/line';
import type { Line } from '../../../services/line';

// 配置 dayjs
dayjs.locale('zh-cn');
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const CapacityCalendarPage: React.FC = () => {
    // 组件状态管理
    const [calendars, setCalendars] = useState<CapacityCalendar[]>([]); // 产能日历数据列表
    const [isModalVisible, setIsModalVisible] = useState(false); // 控制模态框显示
    const [form] = Form.useForm(); // 表单实例
    const [editingId, setEditingId] = useState<number | null | undefined>(null); // 当前编辑的ID
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs()); // 当前选中的日期
    const [selectedLineId, setSelectedLineId] = useState<number>(); // 选中的拉线ID
    const [lines, setLines] = useState<Line[]>([]);
    const [currentView, setCurrentView] = useState('dayGridMonth');

    // 预定义的颜色数组
    const LINE_COLORS = [
        '#1890ff', // 蓝色
        '#52c41a', // 绿色
        '#722ed1', // 紫色
        '#fa8c16', // 橙色
        '#eb2f96', // 粉色
        '#faad14', // 黄色
        '#13c2c2', // 青色
        '#f5222d', // 红色
        '#2f54eb', // 深蓝色
        '#fa541c'  // 橘红色
    ];

    // 获取拉线的颜色
    const getLineColor = (lineId: number) => {
        return LINE_COLORS[lineId % LINE_COLORS.length];
    };

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
            console.log('正在获取产能日历数据:', selectedLineId, currentDate.year(), currentDate.month() + 1);
            const response = await queryCapacityCalendars(selectedLineId, currentDate.year(), currentDate.month() + 1);
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
            const data = {
                lineId: values.lineId,
                startDate: dayjs(values.dateRange[0]).format('YYYY-MM-DD'),
                endDate: dayjs(values.dateRange[1]).format('YYYY-MM-DD'),
                startTime: dayjs(values.timeRange[0]).format('HH:mm:ss'),
                endTime: dayjs(values.timeRange[1]).format('HH:mm:ss'),
                coefficient: values.coefficient,
                name: values.name,
                remark: values.remark
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

    // 将产能日历数据转换为FullCalendar可识别的格式
    const transformCalendarEvents = () => {
        // 月视图显示连续事件，周视图和日视图显示拆分的事件
        if (currentView === 'dayGridMonth') {
            return calendars.map(calendar => {
                const line = lines.find(l => l.id === calendar.lineId);
                const color = getLineColor(calendar.lineId);
                return {
                    id: calendar.id?.toString(),
                    title: `${line?.lineName || ''} - ${calendar.name} - 系数: ${calendar.coefficient}`,
                    start: `${calendar.startDate}T${calendar.startTime}`,
                    end: `${calendar.endDate}T${calendar.endTime}`,
                    extendedProps: {
                        remark: calendar.remark,
                        lineName: line?.lineName,
                        name: calendar.name,
                        coefficient: calendar.coefficient,
                        originalId: calendar.id
                    },
                    backgroundColor: color,
                    borderColor: color,
                    textColor: '#fff'
                };
            });
        } else {
            // 周视图和日视图需要拆分事件
            const events: any[] = [];
            calendars.forEach(calendar => {
                const line = lines.find(l => l.id === calendar.lineId);
                const color = getLineColor(calendar.lineId);
                const startDate = dayjs(calendar.startDate);
                const endDate = dayjs(calendar.endDate);
                
                // 计算日期范围内的每一天
                let currentDate = startDate;
                while (currentDate.isSameOrBefore(endDate, 'day')) {
                    events.push({
                        id: `${calendar.id}-${currentDate.format('YYYY-MM-DD')}`,
                        title: `${line?.lineName || ''} - ${calendar.name} - 系数: ${calendar.coefficient}`,
                        start: `${currentDate.format('YYYY-MM-DD')}T${calendar.startTime}`,
                        end: `${currentDate.format('YYYY-MM-DD')}T${calendar.endTime}`,
                        extendedProps: {
                            remark: calendar.remark,
                            lineName: line?.lineName,
                            name: calendar.name,
                            coefficient: calendar.coefficient,
                            originalId: calendar.id
                        },
                        backgroundColor: color,
                        borderColor: color,
                        textColor: '#fff'
                    });
                    currentDate = currentDate.add(1, 'day');
                }
            });
            return events;
        }
    };

    // 处理日期点击事件
    const handleDateClick = (arg: any) => {
        const clickedDateTime = dayjs(arg.dateStr);
        form.resetFields();
        form.setFieldsValue({
            lineId: selectedLineId,
            dateRange: [clickedDateTime, clickedDateTime],
            timeRange: [dayjs().hour(9).minute(0), dayjs().hour(17).minute(0)],
            coefficient: 1.0,
            name: '早班'
        });
        setEditingId(null);
        setIsModalVisible(true);
    };

    // 处理事件点击
    const handleEventClick = (arg: any) => {
        const calendar = calendars.find(c => c.id === Number(arg.event.extendedProps.originalId));
        if (calendar) {
            form.setFieldsValue({
                lineId: calendar.lineId,
                dateRange: [dayjs(calendar.startDate), dayjs(calendar.endDate)],
                timeRange: [dayjs(`2000-01-01T${calendar.startTime}`), dayjs(`2000-01-01T${calendar.endTime}`)],
                coefficient: calendar.coefficient,
                name: calendar.name,
                remark: calendar.remark
            });
            setEditingId(calendar.id);
            setIsModalVisible(true);
        }
    };

    // 处理日期选择
    const handleDateSelect = (selectInfo: any) => {
        console.log('选择的时间范围:', selectInfo);
        let startDate, endDate, startTime, endTime;
        
        if (currentView === 'dayGridMonth') {
            // 月视图下的处理
            startDate = dayjs(selectInfo.start);
            endDate = dayjs(selectInfo.end).subtract(1, 'day');
            startTime = dayjs().hour(9).minute(0);
            endTime = dayjs().hour(17).minute(0);
        } else {
            // 周视图和日视图下的处理，使用选择的具体时间
            startDate = dayjs(selectInfo.start);
            endDate = dayjs(selectInfo.end);
            startTime = dayjs(selectInfo.start);
            endTime = dayjs(selectInfo.end);
        }

        form.resetFields();
        form.setFieldsValue({
            lineId: selectedLineId,
            dateRange: [startDate, endDate],
            timeRange: [startTime, endTime],
            coefficient: 1.0,
            name: '早班'
        });
        setEditingId(null);
        setIsModalVisible(true);
    };

    return (
        <ConfigProvider locale={zhCN}>
            <Card
                title={
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>产能日历</span>
                        <div style={{display: 'flex', gap: '8px'}}>
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
                            <Button type="primary" onClick={handleAdd}>新增产能日历</Button>
                        </div>
                    </div>
                }
            >
                <FullCalendar
                    plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                        multiMonthPlugin
                    ]}
                    initialView="dayGridMonth"
                    events={transformCalendarEvents()}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    locale="zh-cn"
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    buttonText={{
                        today: '今天',
                        month: '月',
                        week: '周',
                        day: '日'
                    }}
                    dayMaxEvents={true}
                    height="auto"
                    eventDisplay="block"
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
                    viewDidMount={(arg) => {
                        setCurrentView(arg.view.type);
                    }}
                    datesSet={(dateInfo) => {
                        setCurrentDate(dayjs(dateInfo.view.currentStart));
                    }}
                    eventContent={(arg) => {
                        // 如果是选择的临时事件（未保存），只显示时间
                        if (arg.event.display === 'background' || !arg.event.extendedProps.originalId) {
                            return (
                                <div style={{
                                    padding: '2px 4px',
                                    borderRadius: 2,
                                    fontSize: '12px',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {`${dayjs(arg.event.start).format('HH:mm')}-${dayjs(arg.event.end).format('HH:mm')}`}
                                </div>
                            );
                        }

                        // 已保存的事件显示完整信息
                        return (
                            <Tooltip title={
                                <div>
                                    <div>拉线: {arg.event.extendedProps.lineName}</div>
                                    <div>时段: {arg.event.extendedProps.name}</div>
                                    <div>时间: {dayjs(arg.event.start).format('HH:mm')} - {dayjs(arg.event.end).format('HH:mm')}</div>
                                    <div>系数: {arg.event.extendedProps.coefficient}</div>
                                    {arg.event.extendedProps.remark && (
                                        <div>备注: {arg.event.extendedProps.remark}</div>
                                    )}
                                </div>
                            }>
                                <div style={{
                                    padding: '2px 4px',
                                    borderRadius: 2,
                                    fontSize: '12px',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {`${arg.event.extendedProps.lineName} - ${arg.event.extendedProps.name}[${arg.event.extendedProps.coefficient}] (${dayjs(arg.event.start).format('HH:mm')}-${dayjs(arg.event.end).format('HH:mm')})`}
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
                            <DatePicker.RangePicker 
                                style={{width: '100%'}}
                            />
                        </Form.Item>
                        <Form.Item
                            name="timeRange"
                            label="时间范围"
                            rules={[{required: true, message: '请选择时间范围'}]}
                        >
                            <TimePicker.RangePicker 
                                style={{width: '100%'}}
                                format="HH:mm"
                            />
                        </Form.Item>
                        <Form.Item
                            name="name"
                            label="时段名称"
                            rules={[{required: true, message: '请输入时段名称'}]}
                        >
                            <Input placeholder="如：早班、中班、晚班" />
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

