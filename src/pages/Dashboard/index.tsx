import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Progress, Table, Tag, DatePicker, message } from 'antd';
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
import {
  DemandStats,
  PlanStats,
  PullLineStats,
  TodayDemand,
  TodayPlan,
  TrendData,
  getDemandStats,
  getPlanStats,
  getPullLineStats,
  getTodayDemands,
  getTodayPlans,
  getDemandTrend,
  getPlanTrend,
} from '@/services/dashboard';
import './index.less';

// 默认空数据
const emptyData = {
  demandStats: {
    totalCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    delayedCount: 0,
    completionRate: 0,
  },
  planStats: {
    totalCount: 0,
    onScheduleCount: 0,
    delayedCount: 0,
    completionRate: 0,
  },
  pullLineStats: {
    totalLines: 0,
    activeLines: 0,
    productTypes: 0,
    totalPlannedQuantity: 0,
  },
  todayDemands: [] as TodayDemand[],
  todayPlans: [] as TodayPlan[],
  demandTrend: [] as TrendData[],
  planTrend: [] as TrendData[],
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(emptyData);

  // 获取看板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        demandStats,
        planStats,
        pullLineStats,
        todayDemands,
        todayPlans,
        demandTrend,
        planTrend,
      ] = await Promise.all([
        getDemandStats(),
        getPlanStats(),
        getPullLineStats(),
        getTodayDemands(),
        getTodayPlans(),
        getDemandTrend(),
        getPlanTrend(),
      ]);

      setData({
        demandStats,
        planStats,
        pullLineStats,
        todayDemands,
        todayPlans,
        demandTrend,
        planTrend,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '获取看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // 每5分钟刷新一次数据
    const timer = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <ProCard className="dashboard-container">
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="需求执行统计" className="stat-card" bordered={false} loading={loading}>
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
          <Card title="计划执行统计" className="stat-card" bordered={false} loading={loading}>
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
            loading={loading}
          >
            <div className="progress-list">
              {data.todayDemands.length > 0 ? (
                data.todayDemands.map((demand: TodayDemand) => (
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
            loading={loading}
          >
            <div className="progress-list">
              {data.todayPlans.length > 0 ? (
                data.todayPlans.map((plan: TodayPlan) => (
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