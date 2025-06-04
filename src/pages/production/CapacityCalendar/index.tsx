/**
 * 产能日历组件
 * 功能：
 * 1. 展示拉线工作日历
 * 2. 支持新增/编辑/删除工作日历
 * 3. 支持按年月和拉线筛选
 */
import React, {useEffect, useState} from 'react';
import {Card, Button, Modal, Form, Input, DatePicker, InputNumber, message, ConfigProvider, Tooltip, Popconfirm, Select} from 'antd';
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

const { RangePicker } = DatePicker;

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
                startDateTime: dayjs(values.dateTimeRange[0]).format('YYYY-MM-DD HH:mm:ss'),
                endDateTime: dayjs(values.dateTimeRange[1]).format('YYYY-MM-DD HH:mm:ss'),
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
                return {
                    id: calendar.id?.toString(),
                    title: `${line?.lineName || ''} - ${calendar.name} - 系数: ${calendar.coefficient}`,
                    start: calendar.startDateTime,
                    end: calendar.endDateTime,
                    extendedProps: {
                        remark: calendar.remark,
                        lineName: line?.lineName,
                        name: calendar.name,
                        coefficient: calendar.coefficient,
                        originalId: calendar.id
                    },
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    textColor: '#fff'
                };
            });
        } else {
            // 周视图和日视图需要拆分事件
            const events: any[] = [];
            calendars.forEach(calendar => {
                const line = lines.find(l => l.id === calendar.lineId);
                const startDate = dayjs(calendar.startDateTime);
                const endDate = dayjs(calendar.endDateTime);
                const startTime = startDate.format('HH:mm:ss');
                const endTime = endDate.format('HH:mm:ss');
                
                // 计算日期范围内的每一天
                let currentDate = startDate;
                while (currentDate.isSameOrBefore(endDate, 'day')) {
                    events.push({
                        id: `${calendar.id}-${currentDate.format('YYYY-MM-DD')}`,
                        title: `${line?.lineName || ''} - ${calendar.name} - 系数: ${calendar.coefficient}`,
                        start: `${currentDate.format('YYYY-MM-DD')} ${startTime}`,
                        end: `${currentDate.format('YYYY-MM-DD')} ${endTime}`,
                        extendedProps: {
                            remark: calendar.remark,
                            lineName: line?.lineName,
                            name: calendar.name,
                            coefficient: calendar.coefficient,
                            originalId: calendar.id
                        },
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        textColor: '#fff'
                    });
                    currentDate = currentDate.add(1, 'day');
                }
            });
            return events;
        }
    };

    // 处理日历日期点击事件
    const handleDateClick = (arg: any) => {
        const clickedDateTime = dayjs(arg.dateStr);
        const existingEvent = calendars.find(c => {
            const startDate = dayjs(c.startDateTime);
            const endDate = dayjs(c.endDateTime);
            return clickedDateTime.isBetween(startDate, endDate, 'day', '[]') &&
                   clickedDateTime.format('HH:mm:ss') >= startDate.format('HH:mm:ss') &&
                   clickedDateTime.format('HH:mm:ss') <= endDate.format('HH:mm:ss');
        });
        
        if (existingEvent) {
            form.setFieldsValue({
                lineId: existingEvent.lineId,
                dateTimeRange: [dayjs(existingEvent.startDateTime), dayjs(existingEvent.endDateTime)],
                coefficient: existingEvent.coefficient,
                name: existingEvent.name,
                remark: existingEvent.remark
            });
            setEditingId(existingEvent.id);
        } else {
            const startTime = clickedDateTime.hour(9).minute(0).second(0);
            const endTime = clickedDateTime.hour(17).minute(0).second(0);
            form.resetFields();
            form.setFieldsValue({
                lineId: selectedLineId,
                dateTimeRange: [startTime, endTime],
                coefficient: 1.0,
                name: '早班'
            });
            setEditingId(null);
        }
        setIsModalVisible(true);
    };

    // 处理日期选择
    const handleDateSelect = (selectInfo: any) => {
        const startDate = dayjs(selectInfo.start);
        const endDate = dayjs(selectInfo.end).subtract(1, 'day');
        form.resetFields();
        form.setFieldsValue({
            lineId: selectedLineId,
            dateTimeRange: [
                startDate.hour(9).minute(0).second(0),
                endDate.hour(17).minute(0).second(0)
            ],
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
                            <Button type="primary" onClick={handleAdd}>新增</Button>
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
                    eventContent={(arg) => (
                        <Tooltip title={
                            <div>
                                <div>拉线: {arg.event.extendedProps.lineName}</div>
                                <div>时段: {arg.event.extendedProps.name}</div>
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
                                {arg.event.title}
                            </div>
                        </Tooltip>
                    )}
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
                            name="dateTimeRange"
                            label="时间范围"
                            rules={[{required: true, message: '请选择时间范围'}]}
                        >
                            <RangePicker 
                                style={{width: '100%'}} 
                                showTime={{ format: 'HH:mm' }}
                                format="YYYY-MM-DD HH:mm"
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

