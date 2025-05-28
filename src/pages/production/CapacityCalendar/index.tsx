import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Card, Button, Modal, Form, Input, DatePicker, Select, message, ConfigProvider, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import { query, create, update, deleteHoliday, updateStatus, downloadTemplate } from '../../../services/holiday';
import type { Holiday } from '../../../services/holiday';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';

// 配置 dayjs
dayjs.locale('zh-cn');

const CapacityCalendar: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

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

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.holiday) {
        throw new Error('节假日日期不能为空');
      }
      const formData = {
        ...values,
        holiday: values.holiday.format('YYYY-MM-DD'),
        status: values.status ?? 1,
      };

      if (editingId) {
        await update(editingId, formData);
        message.success('更新成功');
      } else {
        await create(formData);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      fetchHolidays();
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '保存失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleCalendarSelect = (date: Dayjs) => {
    form.setFieldsValue({
      holiday: date,
    });
    setEditingId(null);
    setIsModalVisible(true);
  };

  const renderMonthCalendar = (month: number) => {
    const monthStart = currentDate.month(month).startOf('month');
    
    const monthCellRender = (value: Dayjs) => {
      const date = value.format('YYYY-MM-DD');
      const holiday = holidays.find(h => h.holiday === date);
      
      if (holiday) {
        return (
          <Badge 
            status={holiday.status === 1 ? 'error' : 'default'} 
            text={holiday.holidayName} 
          />
        );
      }
      return null;
    };
    
    return (
      <div key={month} style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>{month + 1}月</h3>
        <Calendar
          fullscreen={false}
          mode="month"
          value={monthStart}
          dateCellRender={monthCellRender}
          headerRender={() => null}
          onSelect={handleCalendarSelect}
        />
      </div>
    );
  };

  return (
    <ConfigProvider locale={zhCN}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>产能日历 ({currentDate.year()}年)</span>
            <div>
              <DatePicker
                picker="year"
                value={currentDate}
                onChange={(date) => date && setCurrentDate(date)}
                style={{ marginRight: 8 }}
              />
              <Button onClick={downloadTemplate} style={{ marginRight: 8 }}>下载模板</Button>
              <Button type="primary" onClick={handleAdd}>新增节假日</Button>
            </div>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          {Array.from({ length: 12 }, (_, i) => (
            <Col key={i} xs={24} sm={24} md={12} lg={8} xl={6}>
              {renderMonthCalendar(i)}
            </Col>
          ))}
        </Row>
        <Modal
          title={editingId ? '编辑节假日' : '新增节假日'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="holiday"
              label="日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="holidayName"
              label="名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input />
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
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
};

export default CapacityCalendar;
