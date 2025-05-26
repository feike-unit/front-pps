import React, { useState, useEffect, useRef } from 'react';
import { Card, Modal, message, Space, Select, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ApiError } from '../../../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCNLocale from '@fullcalendar/core/locales/zh-cn';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type { EventSourceInput } from '@fullcalendar/core';
import { UnorderedListOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { searchLines } from '../../../services/line';
import { searchProducts } from '../../../services/product';

// 导入自定义样式
import './calendar.css';

import {
  PlanRuntime,
  ProductType,
  getPlanRuntimePage,
  getPlanRuntimeById,
} from '../../../services/planRuntime';

interface CalendarEvent extends EventInput {
  planId: number;
  completionQuantity?: number;
  taskQuantity?: number;
}

const ProductionCalendar: React.FC = () => {
  const navigate = useNavigate();
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
  
  // 跳转返回列表视图
  const handleBackToListView = () => {
    navigate('/execution/production-plans');
  };
  
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
  
  // 获取指定日期范围内的计划数据，允许指定额外的查询参数
  const fetchEvents = async (
    startStr: string, 
    endStr: string, 
    isRefreshOnly: boolean = false,
    additionalParams?: { lineId?: number, productId?: number }
  ) => {
    // 移除缓存检查，确保每次都请求数据
    try {
      // 只有在非刷新模式或初次加载时才设置整体加载状态
      if (!isRefreshOnly) {
        setLoading(true);
      }
      
      console.log('开始获取数据:', { startStr, endStr });
      
      // 使用合并后的查询参数
      const queryParams = additionalParams 
        ? { ...searchParams, ...additionalParams }
        : searchParams;
      
      // 获取该时间范围内的生产计划数据
      const result = await getPlanRuntimePage({
        pageNum: 1,
        pageSize: 1000, // 获取足够多的数据用于日历显示
        productType: ProductType.SELF_MADE, // 只查询自制件
        startAtBegin: startStr,
        endAtEnd: endStr,
        lineId: queryParams.lineId, // 使用可能更新的lineId
        productId: queryParams.productId, // 使用可能更新的productId
      });
      
      console.log('数据获取成功，数量:', result.list.length);
      
      // 转换为日历事件格式
      const events: CalendarEvent[] = result.list.map(plan => {
        // 根据任务进度设置不同的颜色
        let backgroundColor = '#4285F4'; // 默认蓝色 (Google Calendar的默认颜色)
        let textColor = '#FFFFFF';
        let borderColor = '#4285F4';
        
        // 使用任务进度计算完成百分比
        const progress = plan.taskQuantity > 0 ? plan.completionQuantity / plan.taskQuantity : 0;
        
        if (progress >= 1) {
          backgroundColor = '#34A853'; // 已完成 - 绿色
        } else if (progress >= 0.5) {
          backgroundColor = '#4285F4'; // 完成一半以上 - 蓝色
        } else if (progress > 0) {
          backgroundColor = '#FBBC05'; // 已开始 - 黄色
        } else {
          backgroundColor = '#EA4335'; // 未开始 - 红色
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
      
      // 如果有传入额外参数，同步更新searchParams状态
      if (additionalParams) {
        setSearchParams(prev => ({ ...prev, ...additionalParams }));
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取数据失败');
    } finally {
      // 确保无论如何都重置加载状态
      console.log('重置加载状态');
      setLoading(false);
    }
  };
  
  // 根据筛选条件重新加载事件数据，但保持当前视图
  const refreshEvents = (params?: { lineId?: number, productId?: number }) => {
    console.log('刷新事件，当前查询参数:', params || searchParams);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const startStr = view.activeStart.toISOString().substring(0, 10);
      const endStr = view.activeEnd.toISOString().substring(0, 10);
      
      // 强制重新加载数据，忽略日期范围检查，但标记为仅刷新数据
      setLastFetchRange(null);
      // 使用额外参数直接查询
      fetchEvents(startStr, endStr, true, params);
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
    console.log('日历日期变化:', dateInfo.startStr, dateInfo.endStr);
    
    // 当日期范围变化时，获取新数据
    const startDate = dateInfo.startStr.substring(0, 10);
    const endDate = dateInfo.endStr.substring(0, 10);
    
    // 使用 isRefreshOnly=true 确保不会显示全局加载状态
    fetchEvents(startDate, endDate, true);
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
      <Card bordered={false}>
        <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
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
              onChange={(value: number | null) => {
                console.log('拉线选择改变:', value);
                // 直接使用值刷新，而不是先更新状态
                refreshEvents({ lineId: value === null ? undefined : value });
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
              onChange={(value: number | null) => {
                console.log('货品选择改变:', value);
                // 直接使用值刷新，而不是先更新状态
                refreshEvents({ productId: value === null ? undefined : value });
              }}
              options={searchProductOptions}
              onClick={() => handleProductSearch('')}
            />
          </Space>
          <Button
            type="primary"
            icon={<UnorderedListOutlined />}
            onClick={handleBackToListView}
          >
            返回列表视图
          </Button>
        </div>
        <div 
          className="calendar-container" 
          style={{ 
            maxHeight: 'calc(100vh - 220px)', // 设置最大高度，预留顶部和底部空间
            overflowY: 'auto',  // 垂直方向滚动
            padding: '0 4px'    // 添加一点内边距，确保滚动条不会紧贴内容
          }}
        >
          {loading ? (
            <div style={{ height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              加载中...
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // 周一到周五
                startTime: '08:00',
                endTime: '18:00',
              }}
              weekNumbers={false}
              navLinks={true}
              selectable={true}
              editable={false}
              stickyHeaderDates={true}
              handleWindowResize={true}
              views={{
                dayGridMonth: {
                  titleFormat: { year: 'numeric', month: 'long' }
                },
                timeGridWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }
                },
                timeGridDay: {
                  titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }
                }
              }}
            />
          )}
        </div>
      </Card>
      
      {/* 详情对话框 */}
      <Modal
        title="生产计划详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        zIndex={1100000}
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
              {
                title: '业务类型',
                dataIndex: 'businessType',
              },
              {
                title: '业务单号',
                dataIndex: 'businessDocNo',
              },
              {
                title: '客户订单号',
                dataIndex: 'customerOrderDocNo',
              },
              {
                title: '客户编号',
                dataIndex: 'customerCode',
              },
              {
                title: '客户名称',
                dataIndex: 'customerName',
              },
            ]}
          />
        )}
      </Modal>
    </>
  );
};

export default ProductionCalendar;