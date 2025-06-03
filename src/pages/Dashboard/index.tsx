import React, { useState } from 'react';
import { Card, Col, Row, Statistic, Progress } from 'antd';
import { ProCard } from '@ant-design/pro-components';
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
import './index.less';

// 模拟数据
const mockData = {
  // 生产计划总览
  planOverview: {
    totalPlans: 156,
    inProgress: 45,
    completed: 98,
    delayed: 13,
    planCompletionRate: 78.5,
    onTimeDeliveryRate: 92.3,
  },
  // 产线状态
  lineStatus: {
    totalLines: 24,
    running: 18,
    idle: 4,
    maintenance: 2,
    utilization: 85.2,
  },
  // 产能分析
  capacityAnalysis: {
    plannedCapacity: 10000,
    actualCapacity: 8500,
    capacityUtilization: 85,
    bottleneckLines: 3,
  },
  // 订单执行
  orderExecution: {
    totalOrders: 245,
    onSchedule: 220,
    delayed: 25,
    urgentOrders: 8,
  }
};

const Dashboard: React.FC = () => {
  const [data] = useState(mockData);

  return (
    <ProCard className="dashboard-container">
      {/* 生产计划总览 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<div className="card-title">生产计划总览</div>} 
            className="overview-card"
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="总计划数"
                    value={data.planOverview.totalPlans}
                    prefix={<ScheduleOutlined />}
                  />
                </div>
              </Col>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="执行中"
                    value={data.planOverview.inProgress}
                    prefix={<LoadingOutlined spin />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </div>
              </Col>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="已完成"
                    value={data.planOverview.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </div>
              </Col>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="延期数"
                    value={data.planOverview.delayed}
                    prefix={<AlertOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </div>
              </Col>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="计划完成率"
                    value={data.planOverview.planCompletionRate}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </div>
              </Col>
              <Col span={4}>
                <div className="stat-card">
                  <Statistic
                    title="准时交付率"
                    value={data.planOverview.onTimeDeliveryRate}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 产线状态和产能分析 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title={<div className="card-title">产线状态</div>} 
            className="status-card"
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic
                    title="总产线数"
                    value={data.lineStatus.totalLines}
                    prefix={<RocketOutlined />}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic
                    title="运行中"
                    value={data.lineStatus.running}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<RocketOutlined />}
                  />
                </div>
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <div className="progress-container">
                  <Progress
                    percent={data.lineStatus.utilization}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    strokeWidth={12}
                  />
                  <div className="progress-title">
                    产线利用率
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={<div className="card-title">产能分析</div>} 
            className="analysis-card"
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic
                    title="计划产能"
                    value={data.capacityAnalysis.plannedCapacity}
                    prefix={<BarChartOutlined />}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-card">
                  <Statistic
                    title="实际产能"
                    value={data.capacityAnalysis.actualCapacity}
                    prefix={<BarChartOutlined />}
                  />
                </div>
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <div className="progress-container">
                  <Progress
                    percent={data.capacityAnalysis.capacityUtilization}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    strokeWidth={12}
                  />
                  <div className="progress-title">
                    产能利用率
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 订单执行情况 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title={<div className="card-title">订单执行情况</div>} 
            className="order-card"
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="stat-card">
                  <Statistic
                    title="总订单数"
                    value={data.orderExecution.totalOrders}
                    prefix={<TeamOutlined />}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="stat-card">
                  <Statistic
                    title="按期执行"
                    value={data.orderExecution.onSchedule}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="stat-card">
                  <Statistic
                    title="延期订单"
                    value={data.orderExecution.delayed}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="stat-card">
                  <Statistic
                    title="紧急订单"
                    value={data.orderExecution.urgentOrders}
                    prefix={<AlertOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
};

export default Dashboard; 