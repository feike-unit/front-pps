import React, { useState, useEffect, useRef } from 'react';
import { Card, Modal, message, Space, Select, Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ApiError } from '../../../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCNLocale from '@fullcalendar/core/locales/zh-cn';
import type { EventInput, DateSelectArg, EventClickArg, EventMountArg } from '@fullcalendar/core';
import type { EventSourceInput } from '@fullcalendar/core';
import { UnorderedListOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { searchProducts } from '../../../services/product';

// 导入自定义样式
import './calendar.css';

// 导入需求相关服务
import {
  Demand,
  DemandStatus,
  getDemandPage,
  getDemandById,
} from '../../../services/demand';

interface CalendarEvent extends EventInput {
  demandId: number;
  completionQuantity?: number;
  demandQuantity?: number;
}

const DemandCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [detailRecord, setDetailRecord] = useState<Demand | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [lastFetchRange, setLastFetchRange] = useState<{start: string, end: string} | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState<{
    productId?: number;
    progressFilter?: string;
  }>({});
  const [searchProductOptions, setSearchProductOptions] = useState<{ label: string; value: number }[]>([]);

  // 跳转返回列表视图
  const handleBackToListView = () => {
    navigate('/execution/demands');
  };

  // 处理货品搜索
  const handleProductSearch = debounce(async (value: string) => {
    try {
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
  
  // 获取指定日期范围内的需求数据
  const fetchEvents = async (
    startStr: string, 
    endStr: string, 
    isRefreshOnly: boolean = false,
    additionalParams?: { productId?: number }
  ) => {
    try {
      if (!isRefreshOnly) {
        setLoading(true);
      }
      
      console.log('开始获取数据:', { startStr, endStr });
      
      const queryParams = additionalParams 
        ? { ...searchParams, ...additionalParams }
        : searchParams;
      
      // 获取该时间范围内的需求数据
      const result = await getDemandPage({
        pageNum: 1,
        pageSize: 1000,
        deliveryDateStart: startStr,
        deliveryDateEnd: endStr,
        productId: queryParams.productId,
      });
      
      console.log('数据获取成功，数量:', result.list.length);
      
      // 转换为日历事件格式
      const events: CalendarEvent[] = result.list.map(demand => {
        // 根据完成状态设置不同的颜色
        let backgroundColor = '#4285F4'; // 默认蓝色
        let textColor = '#FFFFFF';
        let borderColor = '#4285F4';
        
        // 计算完成百分比
        const progress = demand.demandQuantity > 0 ? (demand.completionQuantity || 0) / demand.demandQuantity : 0;
        
        if (progress >= 1) {
          backgroundColor = '#34A853'; // 已完成 - 绿色
        } else if (progress >= 0.5) {
          backgroundColor = '#4285F4'; // 完成一半以上 - 蓝色
        } else if (progress > 0) {
          backgroundColor = '#FBBC05'; // 已开始 - 黄色
        } else {
          backgroundColor = '#EA4335'; // 未开始 - 红色
        }
        
        const title = `${demand.productName || '未命名'} (${demand.completionQuantity || 0}/${demand.demandQuantity})`;
        
        return {
          id: demand.id?.toString(),
          title: title,
          start: demand.deliveryDate,
          end: demand.deliveryDate,
          backgroundColor,
          borderColor,
          textColor,
          demandId: demand.id!,
          completionQuantity: demand.completionQuantity,
          demandQuantity: demand.demandQuantity,
          allDay: true
        };
      });
      
      setCalendarEvents(events);
      
      if (additionalParams) {
        setSearchParams(prev => ({ ...prev, ...additionalParams }));
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 根据筛选条件重新加载事件数据
  const refreshEvents = (params?: { productId?: number }) => {
    console.log('刷新事件，当前查询参数:', params || searchParams);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const startStr = view.activeStart.toISOString().substring(0, 10);
      const endStr = view.activeEnd.toISOString().substring(0, 10);
      
      setLastFetchRange(null);
      fetchEvents(startStr, endStr, true, params);
    }
  };
  
  // 处理查看详情
  const handleViewDetails = async (demandId: number) => {
    try {
      const detailData = await getDemandById(demandId);
      setDetailRecord(detailData);
      setDetailModalVisible(true);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取详情失败');
    }
  };
  
  // 处理日历事件点击
  const handleEventClick = (clickInfo: EventClickArg) => {
    const demandId = Number(clickInfo.event.extendedProps.demandId);
    if (demandId) {
      handleViewDetails(demandId);
    }
  };
  
  // 处理日历日期变化
  const handleDatesSet = (dateInfo: any) => {
    console.log('日历日期变化:', dateInfo.startStr, dateInfo.endStr);
    
    const startDate = dateInfo.startStr.substring(0, 10);
    const endDate = dateInfo.endStr.substring(0, 10);
    
    fetchEvents(startDate, endDate, true);
  };

  // 处理事件挂载，添加tooltip
  const handleEventDidMount = (info: EventMountArg) => {
    const el = info.el;
    const event = info.event;
    
    el.removeAttribute('title');
    el.setAttribute('data-title', event.title);
    
    const handleMouseMove = (e: MouseEvent) => {
      const tooltipWidth = 300;
      const tooltipHeight = 40;
      const margin = 10;
      
      let xPos = e.clientX + margin;
      if (xPos + tooltipWidth > window.innerWidth) {
        xPos = e.clientX - tooltipWidth - margin;
      }
      
      let yPos = e.clientY + margin;
      
      if (yPos + tooltipHeight > window.innerHeight && e.clientY > tooltipHeight + margin) {
        yPos = e.clientY - tooltipHeight - margin;
      }
      
      if (yPos + tooltipHeight > window.innerHeight && yPos < 0) {
        yPos = Math.max(margin, Math.min(window.innerHeight - tooltipHeight - margin, e.clientY));
      }
      
      el.style.setProperty('--tooltip-x', `${xPos}px`);
      el.style.setProperty('--tooltip-y', `${yPos}px`);
    };

    el.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
    };
  };

  // 处理进度过滤
  const handleProgressFilter = (progress: string) => {
    setSearchParams(prev => ({
      ...prev,
      progressFilter: progress === prev.progressFilter ? undefined : progress
    }));
  };

  // 过滤事件
  const filterEvents = (events: CalendarEvent[]) => {
    if (!searchParams.progressFilter) {
      return events;
    }

    return events.filter(event => {
      const completionQuantity = event.completionQuantity || 0;
      const demandQuantity = event.demandQuantity || 1;
      const progress = demandQuantity > 0 ? completionQuantity / demandQuantity : 0;
      
      switch (searchParams.progressFilter) {
        case 'completed':
          return progress >= 1;
        case 'halfCompleted':
          return progress >= 0.5 && progress < 1;
        case 'started':
          return progress > 0 && progress < 0.5;
        case 'notStarted':
          return progress === 0;
        default:
          return true;
      }
    });
  };

  // 修改事件获取和显示逻辑
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.removeAllEvents();
      api.addEventSource(filterEvents(calendarEvents));
    }
  }, [calendarEvents, searchParams.progressFilter]);

  // 初始加载数据
  useEffect(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startStr = startDate.toISOString().substring(0, 10);
    const endStr = endDate.toISOString().substring(0, 10);
    
    fetchEvents(startStr, endStr);
    
    handleProductSearch('');
  }, []);

  return (
    <>
      <Card bordered={false}>
        <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Space>
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
                refreshEvents({ productId: value === null ? undefined : value });
              }}
              options={searchProductOptions}
              onClick={() => handleProductSearch('')}
            />
            <Space size={4}>
              <Tag 
                color="#34A853" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleProgressFilter('completed')}
              >
                已完成 {searchParams.progressFilter === 'completed' && '✓'}
              </Tag>
              <Tag 
                color="#4285F4" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleProgressFilter('halfCompleted')}
              >
                完成一半以上 {searchParams.progressFilter === 'halfCompleted' && '✓'}
              </Tag>
              <Tag 
                color="#FBBC05" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleProgressFilter('started')}
              >
                已开始 {searchParams.progressFilter === 'started' && '✓'}
              </Tag>
              <Tag 
                color="#EA4335" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleProgressFilter('notStarted')}
              >
                未开始 {searchParams.progressFilter === 'notStarted' && '✓'}
              </Tag>
            </Space>
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
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
            padding: '0 4px'
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
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
              }}
              locale={zhCNLocale}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventDidMount={handleEventDidMount}
              datesSet={handleDatesSet}
              height="auto"
              dayMaxEvents={false}
              firstDay={1}
              eventDisplay="block"
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
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
                dayGridWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }
                },
                dayGridDay: {
                  titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }
                }
              }}
            />
          )}
        </div>
      </Card>
      
      {/* 详情对话框 */}
      <Modal
        title="需求详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        zIndex={1100000}
      >
        {detailRecord && (
          <ProDescriptions<Demand>
            column={2}
            title={false}
            dataSource={detailRecord}
            columns={[
              {
                title: '货品编号/名称',
                dataIndex: 'productCode',
                render: (_, record) => record.productCode ? `${record.productCode} - ${record.productName}` : record.productName,
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
                title: '需求数量',
                dataIndex: 'demandQuantity',
              },
              {
                title: '生产数量',
                dataIndex: 'purgeQuantity',
              },
              {
                title: '报工数量',
                dataIndex: 'registeredQuantity',
              },
              {
                title: '完工数量',
                dataIndex: 'completionQuantity',
              },
              {
                title: '交期',
                dataIndex: 'deliveryDate',
              },
              {
                title: '开始日期',
                dataIndex: 'startDate',
              },
              {
                title: '结束日期',
                dataIndex: 'endDate',
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

export default DemandCalendar; 