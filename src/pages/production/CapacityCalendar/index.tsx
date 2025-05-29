/**
 * 产能日历组件
 * 功能：
 * 1. 展示节假日日历
 * 2. 支持新增/编辑/删除节假日
 * 3. 支持按年份筛选节假日
 */
import React, {useEffect, useState} from 'react';
import {Card, Button, Modal, Form, Input, DatePicker, Select, message, ConfigProvider, Tooltip, Popconfirm} from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type {Dayjs} from 'dayjs';
import {query, create, update, deleteHoliday, updateStatus, downloadTemplate} from '../../../services/holiday';
import type {Holiday} from '../../../services/holiday';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';

// 配置 dayjs
dayjs.locale('zh-cn');

const CapacityCalendar: React.FC = () => {
    // 组件状态管理
    const [holidays, setHolidays] = useState<Holiday[]>([]); // 节假日数据列表
    const [isModalVisible, setIsModalVisible] = useState(false); // 控制模态框显示
    const [form] = Form.useForm(); // 表单实例
    const [editingId, setEditingId] = useState<number | null | undefined>(null); // 当前编辑的节假日ID
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs()); // 当前选中的年份
    const [isDateClick, setIsDateClick] = useState(false); // 是否是通过点击日期新增

    // 获取节假日数据
    const fetchHolidays = async () => {
        try {
            const response = await query({
                year: currentDate.year()
            });
            setHolidays(response);
        } catch (error: any) {
            message.error(error.response?.data?.message || error.message || '获取节假日数据失败');
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [currentDate]);

    // 处理模态框确认操作（新增/编辑节假日）
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const holidayDate = dayjs(values.holiday).format('YYYY-MM-DD');
            
            if (editingId) {
                await update(editingId, {
                    holiday: holidayDate,
                    holidayName: values.holidayName,
                    status: values.status,
                    remark: values.remark
                });
            } else {
                await create({
                    holiday: holidayDate,
                    holidayName: values.holidayName,
                    status: values.status,
                    remark: values.remark
                });
            }
            message.success(editingId ? '更新成功' : '新增成功');
            setIsModalVisible(false);
            fetchHolidays();
        } catch (error: any) {
            message.error(error.response?.data?.message || error.message || '操作失败');
        }
    };

    // 处理新增节假日按钮点击
    const handleAdd = () => {
        form.resetFields();
        setEditingId(null);
        setIsDateClick(false);
        setIsModalVisible(true);
    };

    // 处理日历日期点击事件
    const handleDateClick = (arg: any) => {
        const existingHoliday = holidays.find(h => h.holiday === arg.dateStr);
        if (existingHoliday) {
            form.setFieldsValue({
                holiday: dayjs(existingHoliday.holiday),
                holidayName: existingHoliday.holidayName,
                status: existingHoliday.status,
                remark: existingHoliday.remark
            });
            setEditingId(existingHoliday.id);
            setIsDateClick(false);
        } else {
            form.resetFields();
            form.setFieldsValue({
                holiday: [dayjs(arg.dateStr)]
            });
            setEditingId(null);
            setIsDateClick(true);
        }
        setIsModalVisible(true);
    };

    // 处理日历日期选择
    const handleCalendarSelect = (date: Dayjs) => {
        form.setFieldsValue({
            holiday: date,
        });
        setEditingId(null);
        setIsModalVisible(true);
    };

    // 将节假日数据转换为FullCalendar可识别的格式
    const calendarEvents = holidays
        .filter(holiday => holiday.status === 1)
        .map(holiday => ({
            title: holiday.holidayName,
            date: holiday.holiday,
            extendedProps: {
                remark: holiday.remark
            },
            backgroundColor: '#666666',
            borderColor: '#666666',
            textColor: '#fff'
        }));

    // 处理节假日事件点击（编辑）
    const handleEventClick = (arg: any) => {
        const holiday = holidays.find(h => h.holiday === arg.event.startStr);
        if (holiday) {
            form.setFieldsValue({
                holiday: dayjs(holiday.holiday),
                holidayName: holiday.holidayName,
                status: holiday.status,
                remark: holiday.remark
            });
            if (holiday.id !== undefined) {
                setEditingId(holiday.id);
            }
            setIsModalVisible(true);
        }
    };

    // 处理删除节假日
    const handleDelete = async (id: number | null) => {
        if (id === null) return;
        
        try {
            await deleteHoliday(id);
            message.success('删除成功');
            fetchHolidays();
        } catch (error: any) {
            message.error(error.response?.data?.message || error.message || '删除失败');
        }
    };

    return (
        <ConfigProvider locale={zhCN}>
            <Card
                title={
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>产能日历 ({currentDate.year()}年)</span>
                        <div>
                            <DatePicker
                                picker="year"
                                value={currentDate}
                                onChange={(date) => date && setCurrentDate(date)}
                                style={{marginRight: 8}}
                            />
                            <Button onClick={downloadTemplate} style={{marginRight: 8}}>下载模板</Button>
                            <Button type="primary" onClick={handleAdd}>新增节假日</Button>
                        </div>
                    </div>
                }
            >
                {/* FullCalendar配置
                  plugins: 使用的插件
                  initialView: 初始视图
                  multiMonthMaxColumns: 多月份视图最大列数
                  events: 日历事件数据
                  dateClick: 日期点击回调
                  eventClick: 事件点击回调
                  locale: 本地化语言
                  dayCellClassNames: 非当前月份日期样式
                  headerToolbar: 隐藏头部工具栏
                  eventContent: 自定义事件内容
                */}
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
                    initialView="multiMonthYear"
                    multiMonthMaxColumns={4}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    locale="zh-cn"
                    selectable={true}
                    selectMirror={true}
                    select={(arg) => {
                        form.resetFields();
                        form.setFieldsValue({
                            holiday: [dayjs(arg.startStr), dayjs(arg.endStr)]
                        });
                        setEditingId(null);
                        setIsModalVisible(true);
                    }}
                    dayCellClassNames={(arg) => {
                        return arg.isOtherMonth ? ['fc-non-month-day'] : [];
                    }}
                    headerToolbar={false}
                    eventContent={(arg) => (
                        <Tooltip
                            title={`${arg.event.title}${arg.event.extendedProps.remark ? ' - ' + arg.event.extendedProps.remark : ''}`}>
                            <div style={{padding: '2px 4px', borderRadius: 2}}>
                                {arg.event.title}
                            </div>
                        </Tooltip>
                    )}
                />
                <Modal
                    title={editingId ? '编辑节假日' : '新增节假日'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => setIsModalVisible(false)}
                    footer={[
                        editingId && (
                            <Popconfirm
                                key="delete"
                                title="确定要删除这个节假日吗？"
                                onConfirm={() => {
                                    handleDelete(editingId);
                                    setIsModalVisible(false);
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
                            name="holiday"
                            label="日期"
                            rules={[{required: true, message: '请选择日期'}]}
                        >
                            <DatePicker
                                style={{width: '100%'}}
                                disabled={!!editingId || isDateClick}
                                placeholder="选择日期"
                            />
                        </Form.Item>
                        <Form.Item
                            name="holidayName"
                            label="名称"
                            rules={[{required: true, message: '请输入名称'}]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item
                            name="status"
                            label="状态"
                            initialValue={1}
                        >
                            <Select>
                                <Select.Option value={1}>启用</Select.Option>
                                <Select.Option value={0}>禁用</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="remark"
                            label="备注"
                        >
                            <Input.TextArea/>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </ConfigProvider>
    );
};

export default CapacityCalendar;
