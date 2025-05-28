import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Badge, Card, Button, Modal, Form, Input, DatePicker, Select, message, Table, Upload } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { BadgeProps, UploadFile } from 'antd';
import { createHoliday, deleteHoliday, listHolidays, updateHoliday, importHolidays, downloadTemplate } from '@/services/holiday';
import type { Holidays } from '@/services/types';
import dayjs from 'dayjs';

const CapacityCalendar: React.FC = () => {
  const [holidays, setHolidays] = useState<Holidays[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const uploadRef = useRef<any>();

  const fetchHolidays = async () => {
    try {
      const response = await listHolidays();
      setHolidays(response);
    } catch (error) {
      message.error('获取节假日数据失败');
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const dateCellRender = (value: Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    const holiday = holidays.find(h => h.holidayDate === date);
    
    if (holiday) {
      const status = holiday.enabled ? 'success' : 'default';
      return (
        <div>
          <Badge status={status as BadgeProps['status']} text={holiday.description} />
        </div>
      );
    }
    return null;
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.holidayDate) {
        throw new Error('节假日日期不能为空');
      }
      const formData = {
        ...values,
        holidayDate: values.holidayDate.format('YYYY-MM-DD'),
        enabled: values.enabled ?? true, // 使用表单中的enabled值，如果未设置则默认为true
      };

      if (editingId) {
        await updateHoliday(editingId, formData);
        message.success('更新成功');
      } else {
        await createHoliday(formData);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      fetchHolidays();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (holiday: Holidays) => {
    form.setFieldsValue({
      ...holiday,
      holidayDate: dayjs(holiday.holidayDate),
    });
    setEditingId(holiday.id);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHoliday(id);
      message.success('删除成功');
      fetchHolidays();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCalendarSelect = (date: Dayjs) => {
    form.setFieldsValue({
      holidayDate: date,
    });
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleImport = async (file: UploadFile) => {
    if (!file) return false;
    setImporting(true);
    try {
      await importHolidays(file as File);
      message.success('导入成功');
      fetchHolidays();
      if (uploadRef.current) {
        uploadRef.current.fileList = [];
      }
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
    return false;
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'holidayDate',
      key: 'holidayDate',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Holidays) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </>
      ),
    },
  ];

  return (
    <Card
      title="产能日历"
      extra={<Button type="primary" onClick={handleAdd}>新增节假日</Button>}
    >
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={handleCalendarSelect}
      />
      <Table
        columns={columns}
        dataSource={holidays}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      <Modal
        title={editingId ? '编辑节假日' : '新增节假日'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="holidayDate"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="enabled"
            label="状态"
            initialValue={true}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Upload
        ref={uploadRef}
        showUploadList={false}
        beforeUpload={handleImport}
        accept=".xlsx, .xls"
        style={{ marginTop: 16 }}
      >
        <Button icon={<UploadOutlined />} loading={importing}>
          导入节假日
        </Button>
      </Upload>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleDownloadTemplate}
        style={{ marginTop: 16, marginLeft: 8 }}
      >
        下载模板
      </Button>
    </Card>
  );
};

export default CapacityCalendar;
