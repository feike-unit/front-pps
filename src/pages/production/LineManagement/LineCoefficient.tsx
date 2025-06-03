import React, {useEffect, useState} from 'react';
import {Button, Card, DatePicker, Form, Input, message, Modal, Popconfirm, Tooltip} from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {Dayjs} from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import type {LineCoefficient} from '../../../services/line';
import {
  createLineCoefficient,
  deleteLineCoefficient,
  getLineCoefficientsByLineId,
  updateLineCoefficient,
} from '../../../services/line';
import type {ApiError} from '../../../services/api';

const { RangePicker } = DatePicker;

interface LineCoefficientProps {
  lineId: number;
  visible: boolean;
  onClose: () => void;
}

const LineCoefficient: React.FC<LineCoefficientProps> = ({ lineId, visible, onClose }) => {
  const [coefficients, setCoefficients] = useState<LineCoefficient[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  // 获取系数数据
  const fetchCoefficients = async () => {
    try {
      const data = await getLineCoefficientsByLineId(lineId);
      setCoefficients(data);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取系数数据失败');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCoefficients();
    }
  }, [visible, lineId]);

  // 将系数数据转换为日历事件
  const calendarEvents = coefficients.map(coef => ({
    id: coef.id?.toString(),
    title: `系数: ${coef.coefficient}`,
    date: coef.dayDate,
    extendedProps: {
      coefficient: coef.coefficient
    },
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
    textColor: '#fff'
  }));

  // 处理日期选择
  const handleDateSelect = (selectInfo: any) => {
    form.resetFields();
    form.setFieldsValue({
      dateRange: [dayjs(selectInfo.start), dayjs(selectInfo.end).subtract(1, 'day')],
    });
    setEditingId(null);
    setIsModalVisible(true);
  };

  // 处理事件点击
  const handleEventClick = (clickInfo: any) => {
    const coefficient = coefficients.find(c => c.id?.toString() === clickInfo.event.id);
    if (coefficient) {
      form.setFieldsValue({
        dateRange: [dayjs(coefficient.dayDate), dayjs(coefficient.dayDate)],
        coefficient: coefficient.coefficient,
      });
      setEditingId(coefficient.id!);
      setIsModalVisible(true);
    }
  };

  // 处理表单提交
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const params = {
        lineId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        coefficient: values.coefficient,
      };

      if (editingId) {
        await updateLineCoefficient(editingId, params);
        message.success('更新成功');
      } else {
        await createLineCoefficient(params);
        message.success('创建成功');
      }

      setIsModalVisible(false);
      fetchCoefficients();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '操作失败');
    }
  };

  return (
    <Modal
      title="拉线系数维护"
      open={visible}
      onCancel={onClose}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ padding: '12px' }}
      footer={null}
    >
      <Card bodyStyle={{ padding: '12px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={currentDate.format('YYYY-MM-DD')}
          locale="zh-cn"
          selectable={true}
          selectMirror={true}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          datesSet={(dateInfo) => {
            setCurrentDate(dayjs(dateInfo.view.currentStart));
          }}
          eventContent={(arg) => (
            <Tooltip title={`系数: ${arg.event.extendedProps.coefficient}`}>
              <div style={{ padding: '2px 4px', borderRadius: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {arg.event.title}
              </div>
            </Tooltip>
          )}
        />
      </Card>

      <Modal
        title={editingId ? '编辑系数' : '新增系数'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
        maskClosable={false}
        width={500}
        footer={[
          editingId && (
            <Popconfirm
              key="delete"
              title="确定要删除这个系数吗？"
              onConfirm={async () => {
                try {
                  await deleteLineCoefficient(editingId);
                  message.success('删除成功');
                  setIsModalVisible(false);
                  fetchCoefficients();
                } catch (error) {
                  const apiError = error as ApiError;
                  message.error(apiError.response?.data?.message || apiError.message || '删除失败');
                }
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>删除</Button>
            </Popconfirm>
          ),
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleModalOk}>
            确定
          </Button>,
        ].filter(Boolean)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
              name="coefficient"
              label="系数"
              rules={[
                { required: true, message: '请输入系数' },
                {
                  validator: (_, value) => {
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                      return Promise.reject('请输入有效的数字');
                    }
                    if (num <= 0) {
                      return Promise.reject('系数必须大于0');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
          >
            <Input type="number" step="0.1" min="0"/>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default LineCoefficient; 