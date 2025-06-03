import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Progress, Table, Tag, DatePicker } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  BarChartOutlined,
  RocketOutlined,
  AlertOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import './index.less';

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [data, setData] = useState({
    demandStats: {
      totalCount: 156,
      inProgressCount: 45,
      completedCount: 98,
      delayedCount: 13,
      completionRate: 78.5,
    },
    planStats: {
      totalCount: 245,
      onScheduleCount: 220,
      delayedCount: 25,
      completionRate: 89.8,
    },
    recentDemands: [
      {
        id: 1,
        businessDocNo: 'DD202403001',
        customerName: '客户A',
        productName: '产品A',
        demandQuantity: 1000,
        completionQuantity: 600,
        deliveryDate: '2024-03-15',
        status: 1,
        updateTime: '2024-03-15 10:00:00',
      },
      {
        id: 2,
        businessDocNo: 'DD202403002',
        customerName: '客户B',
        productName: '产品B',
        demandQuantity: 800,
        completionQuantity: 400,
        deliveryDate: '2024-03-16',
        status: 1,
        updateTime: '2024-03-15 09:30:00',
      },
      {
        id: 3,
        businessDocNo: 'DD202403003',
        customerName: '客户C',
        productName: '产品C',
        demandQuantity: 500,
        completionQuantity: 500,
        deliveryDate: '2024-03-15',
        status: 2,
        updateTime: '2024-03-14 15:00:00',
      },
    ],
    recentPlans: [
      {
        id: 1,
        batchCode: 'BP202403001',
        lineName: '产线A',
        productName: '产品A',
        taskQuantity: 500,
        completionQuantity: 300,
        startDate: '2024-03-01',
        endDate: '2024-03-10',
        status: 1,
        updateTime: '2024-03-15 11:00:00',
      },
    ],
    demandTrend: [
      { date: '2024-03-01', value: 100 },
      { date: '2024-03-02', value: 120 },
      { date: '2024-03-03', value: 140 },
      { date: '2024-03-04', value: 130 },
      { date: '2024-03-05', value: 150 },
    ],
    planTrend: [
      { date: '2024-03-01', value: 80 },
      { date: '2024-03-02', value: 90 },
      { date: '2024-03-03', value: 110 },
      { date: '2024-03-04', value: 100 },
      { date: '2024-03-05', value: 120 },
    ],
  });

  // 需求趋势配置
  const demandTrendConfig = {
    data: data.demandTrend,
    xField: 'date',
    yField: 'value',
    smooth: true,
    meta: {
      value: {
        alias: '需求完成量',
      },
    },
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#1890ff',
        lineWidth: 2,
      },
    },
  };

  // 计划趋势配置
  const planTrendConfig = {
    data: data.planTrend,
    xField: 'date',
    yField: 'value',
    smooth: true,
    meta: {
      value: {
        alias: '计划完成量',
      },
    },
    color: '#52c41a',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#52c41a',
        lineWidth: 2,
      },
    },
  };

  // 获取今日的需求数据
  const getTodayDemands = () => {
    const today = dayjs().format('YYYY-MM-DD');
    return data.recentDemands.filter(demand => 
      dayjs(demand.updateTime).format('YYYY-MM-DD') === today
    );
  };

  // 获取今日的计划数据
  const getTodayPlans = () => {
    const today = dayjs().format('YYYY-MM-DD');
    return data.recentPlans.filter(plan => 
      dayjs(plan.updateTime).format('YYYY-MM-DD') === today
    );
  };

  return (
    <ProCard className="dashboard-container">
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="需求执行统计" className="stat-card" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="总需求数"
                  value={data.demandStats.totalCount}
                  prefix={<ScheduleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="执行中"
                  value={data.demandStats.inProgressCount}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<LoadingOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已完成"
                  value={data.demandStats.completedCount}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="延期数"
                  value={data.demandStats.delayedCount}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<AlertOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Line {...demandTrendConfig} height={200} />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="计划执行统计" className="stat-card" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="总计划数"
                  value={data.planStats.totalCount}
                  prefix={<ScheduleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="按期执行"
                  value={data.planStats.onScheduleCount}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="延期计划"
                  value={data.planStats.delayedCount}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<AlertOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="完成率"
                  value={data.planStats.completionRate}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Line {...planTrendConfig} height={200} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 需求和计划执行进度 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={
              <div className="card-header">
                <span>今日需求执行进度</span>
                <span className="card-date">{dayjs().format('YYYY-MM-DD')}</span>
              </div>
            } 
            className="progress-card" 
            bordered={false}
          >
            <div className="progress-list">
              {getTodayDemands().length > 0 ? (
                getTodayDemands().map(demand => (
                  <div key={demand.id} className="progress-item">
                    <div className="progress-info">
                      <div className="progress-title">
                        {demand.businessDocNo} - {demand.productName}
                      </div>
                      <div className="progress-sub">
                        客户: {demand.customerName} | 交付日期: {demand.deliveryDate}
                      </div>
                    </div>
                    <div className="progress-status">
                      <Progress
                        percent={Math.round((demand.completionQuantity / demand.demandQuantity) * 100)}
                        status={demand.status === 2 ? 'success' : 'active'}
                        strokeWidth={8}
                      />
                      <div className="progress-value">
                        {demand.completionQuantity}/{demand.demandQuantity}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">今日暂无需求执行数据</div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <div className="card-header">
                <span>今日计划执行进度</span>
                <span className="card-date">{dayjs().format('YYYY-MM-DD')}</span>
              </div>
            }
            className="progress-card" 
            bordered={false}
          >
            <div className="progress-list">
              {getTodayPlans().length > 0 ? (
                getTodayPlans().map(plan => (
                  <div key={plan.id} className="progress-item">
                    <div className="progress-info">
                      <div className="progress-title">
                        {plan.batchCode} - {plan.productName}
                      </div>
                      <div className="progress-sub">
                        产线: {plan.lineName} | {plan.startDate} ~ {plan.endDate}
                      </div>
                    </div>
                    <div className="progress-status">
                      <Progress
                        percent={Math.round((plan.completionQuantity / plan.taskQuantity) * 100)}
                        status={plan.status === 2 ? 'success' : 'active'}
                        strokeWidth={8}
                      />
                      <div className="progress-value">
                        {plan.completionQuantity}/{plan.taskQuantity}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">今日暂无计划执行数据</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
};

export default Dashboard;