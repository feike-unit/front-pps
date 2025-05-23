import React, { useState, useEffect, useRef } from 'react';
import { Card, Modal, message, Space, Select } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ApiError } from '../../../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCNLocale from '@fullcalendar/core/locales/zh-cn';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { EventSourceInput } from '@fullcalendar/core';
import debounce from 'lodash/debounce';
import { searchLines } from '../../../services/line';
import { searchProducts } from '../../../services/product';

// 导入自定义样式
import './calendar.css';

import {
  PlanRuntime,
  ProductType,
  TaskStatus,
  getPlanRuntimePage,
  getPlanRuntimeById,
} from '../../../services/planRuntime';

interface CalendarEvent extends EventInput {
  planId: number;
  completionQuantity?: number;
  taskQuantity?: number;
}

const CalendarView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<PlanRuntime | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [lastFetchRange, setLastFetchRange] = useState<{start: string, end: string} | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState<{
    lineId?: number;
    productId?: number;
  }>({});
  const [searchLineOptions, setSearchLineOptions] = useState<{ label: string; value: number }[]>([]);
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);
  
  // 处理拉线搜索
  const handleLineSearch = debounce(async (value: string) => {
    try {
      const lines = await searchLines(value || '');
      const options = lines.map(line => ({
        label: `${line.lineCode} - ${line.lineName}`,
        value: line.id!
      }));
      setSearchLineOptions(options);
    } catch (error: any) {
      message.error('搜索拉线失败');
    }
  }, 500);

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
      // 只搜索自制件类型的货品
      const products = await searchProducts(value || '');
      const options = products.map(product => ({
        label: `${product.productCode} - ${product.productName}`,
        value: product.id!
      }));
      setSearchProductOptions(options);
    } catch (error: any) {
      message.error('搜索货品失败');
    }
  }, 500);
  
  // 获取指定日期范围内的计划数据
  const fetchEvents = async (startStr: string, endStr: string) => {
    // 避免重复请求相同日期范围的数据
    if (lastFetchRange && 
        lastFetchRange.start === startStr && 
        lastFetchRange.end === endStr && 
        !isInitialLoad) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 记录本次请求的日期范围
      setLastFetchRange({ start: startStr, end: endStr });
      setIsInitialLoad(false);
      
      // 获取该时间范围内的生产计划数据
      const result = await getPlanRuntimePage({
        pageNum: 1,
        pageSize: 1000, // 获取足够多的数据用于日历显示
        productType: ProductType.SELF_MADE, // 只查询自制件
        startAtBegin: startStr,
        endAtEnd: endStr,
        ...searchParams, // 添加拉线和货品筛选条件
      });
      
      // 转换为日历事件格式
      const events: CalendarEvent[] = result.list.map(plan => {
        // 根据任务状态设置不同的颜色
        let backgroundColor = '#4285F4'; // 默认蓝色 (Google Calendar的默认颜色)
        let textColor = '#FFFFFF';
        let borderColor = '#4285F4';
        
        if (plan.taskStatus === TaskStatus.COMPLETED) {
          backgroundColor = '#34A853'; // 已完成 - 绿色
        } else if (plan.taskStatus === TaskStatus.EXECUTING) {
          backgroundColor = '#4285F4'; // 执行中 - 蓝色
        } else if (plan.taskStatus === TaskStatus.CONFIRMED) {
          backgroundColor = '#FBBC05'; // 已确认 - 黄色
        } else if (plan.taskStatus === TaskStatus.CANCELLED) {
          backgroundColor = '#EA4335'; // 已取消 - 红色
        }
        
        const title = `${plan.productName || '未命名'} (${plan.completionQuantity}/${plan.taskQuantity})`;
        
        // 处理结束日期，使其包含整个结束当天
        let endDate = plan.endAt;
        if (endDate) {
          // 将结束日期调整为第二天的 00:00
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1);
          endDate = endDateObj.toISOString().substring(0, 10);
        }
        
        return {
          id: plan.id.toString(),
          title: title,
          start: plan.startAt,
          end: endDate,
          backgroundColor,
          borderColor,
          textColor,
          planId: plan.id,
          completionQuantity: plan.completionQuantity,
          taskQuantity: plan.taskQuantity,
          allDay: true
        };
      });
      
      setCalendarEvents(events);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理查看详情
  const handleViewDetails = async (planId: number) => {
    try {
      const detailData = await getPlanRuntimeById(planId);
      setDetailRecord(detailData);
      setDetailModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取详情失败');
    }
  };
  
  // 处理日历事件点击
  const handleEventClick = (clickInfo: EventClickArg) => {
    const planId = Number(clickInfo.event.extendedProps.planId);
    if (planId) {
      handleViewDetails(planId);
    }
  };
  
  // 处理日历日期变化
  const handleDatesSet = (dateInfo: any) => {
    // 仅在视图变更时才触发数据获取 (月视图切换、视图类型变更等)
    if (!lastFetchRange || 
        dateInfo.startStr.substring(0, 7) !== lastFetchRange.start.substring(0, 7) ||
        dateInfo.view.type !== dateInfo.oldView?.type) {
      const startDate = dateInfo.startStr.substring(0, 10);
      const endDate = dateInfo.endStr.substring(0, 10);
      fetchEvents(startDate, endDate);
    }
  };

  // 初始加载数据
  useEffect(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startStr = startDate.toISOString().substring(0, 10);
    const endStr = endDate.toISOString().substring(0, 10);
    
    fetchEvents(startStr, endStr);
    
    // 初始加载默认选项
    handleLineSearch('');
    handleProductSearch('');
  }, []);

  return (
    <>
      <Card loading={loading} bordered={false}>
        <div className="calendar-header">
          <Space>
            <Select
              placeholder="拉线"
              style={{ width: 200 }}
              showSearch
              allowClear
              defaultActiveFirstOption={false}
              filterOption={false}
              onSearch={handleLineSearch}
              value={searchParams.lineId}
              onChange={(value: number) => {
                setSearchParams(prev => ({ ...prev, lineId: value }));
                // 重置日期范围，触发重新加载
                setLastFetchRange(null);
                // 获取当前日历视图的日期范围
                if (calendarRef.current) {
                  const calendarApi = calendarRef.current.getApi();
                  const view = calendarApi.view;
                  const startStr = view.activeStart.toISOString().substring(0, 10);
                  const endStr = view.activeEnd.toISOString().substring(0, 10);
                  fetchEvents(startStr, endStr);
                }
              }}
              options={searchLineOptions}
              onClick={() => handleLineSearch('')}
            />
            <Select
              placeholder="货品"
              style={{ width: 200 }}
              showSearch
              allowClear
              defaultActiveFirstOption={false}
              filterOption={false}
              onSearch={handleProductSearch}
              value={searchParams.productId}
              onChange={(value: number) => {
                setSearchParams(prev => ({ ...prev, productId: value }));
                // 重置日期范围，触发重新加载
                setLastFetchRange(null);
                // 获取当前日历视图的日期范围
                if (calendarRef.current) {
                  const calendarApi = calendarRef.current.getApi();
                  const view = calendarApi.view;
                  const startStr = view.activeStart.toISOString().substring(0, 10);
                  const endStr = view.activeEnd.toISOString().substring(0, 10);
                  fetchEvents(startStr, endStr);
                }
              }}
              options={searchProductOptions}
              onClick={() => handleProductSearch('')}
            />
          </Space>
        </div>
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: ''
            }}
            locale={zhCNLocale}
            events={calendarEvents}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            dayMaxEventRows={3}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            firstDay={1} // 从周一开始
            eventDisplay="block"
            nowIndicator={true}
            businessHours={true}
            weekNumbers={false}
            navLinks={true}
            selectable={true}
            editable={false}
            stickyHeaderDates={true}
            handleWindowResize={true}
          />
        </div>
      </Card>
      
      {/* 详情对话框 */}
      <Modal
        title="生产计划详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {detailRecord && (
          <ProDescriptions<PlanRuntime>
            column={2}
            title={false}
            dataSource={detailRecord}
            columns={[
              {
                title: '批次号',
                dataIndex: 'batchCode',
              },
              {
                title: '货品编号/名称',
                dataIndex: 'productCode',
                render: (_, record) => record.productCode ? `${record.productCode} - ${record.productName}` : record.productName,
              },
              {
                title: '拉线',
                dataIndex: 'lineName',
                render: (_, record) => record.lineCode ? `${record.lineCode} - ${record.lineName}` : record.lineName,
              },
              {
                title: '货品类型',
                dataIndex: 'productType',
                valueEnum: {
                  1: { text: '采购件' },
                  2: { text: '自制件' },
                  3: { text: '委外件' },
                },
              },
              {
                title: '任务数量',
                dataIndex: 'taskQuantity',
              },
              {
                title: '登记数量',
                dataIndex: 'registeredQuantity',
              },
              {
                title: '完成数量',
                dataIndex: 'completionQuantity',
              },
              {
                title: '开始日期',
                dataIndex: 'startAt',
                render: (_, record) => record.startAt ? record.startAt.substring(0, 10) : '-',
              },
              {
                title: '结束日期',
                dataIndex: 'endAt',
                render: (_, record) => record.endAt ? record.endAt.substring(0, 10) : '-',
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
              },
            ]}
          />
        )}
      </Modal>
    </>
  );
};

export default CalendarView;