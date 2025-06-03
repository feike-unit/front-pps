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
    <ProCard>
      {/* 生产计划总览 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="生产计划总览" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={4}>
                <Statistic
                  title="总计划数"
                  value={data.planOverview.totalPlans}
                  prefix={<ScheduleOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="执行中"
                  value={data.planOverview.inProgress}
                  prefix={<LoadingOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="已完成"
                  value={data.planOverview.completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="延期数"
                  value={data.planOverview.delayed}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="计划完成率"
                  value={data.planOverview.planCompletionRate}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="准时交付率"
                  value={data.planOverview.onTimeDeliveryRate}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 产线状态和产能分析 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="产线状态" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总产线数"
                  value={data.lineStatus.totalLines}
                  prefix={<RocketOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="运行中"
                  value={data.lineStatus.running}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<RocketOutlined />}
                />
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <div style={{ padding: '0 24px' }}>
                  <Progress
                    percent={data.lineStatus.utilization}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    产线利用率
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="产能分析" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="计划产能"
                  value={data.capacityAnalysis.plannedCapacity}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="实际产能"
                  value={data.capacityAnalysis.actualCapacity}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={24} style={{ marginTop: 16 }}>
                <div style={{ padding: '0 24px' }}>
                  <Progress
                    percent={data.capacityAnalysis.capacityUtilization}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
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
          <Card title="订单执行情况" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="总订单数"
                  value={data.orderExecution.totalOrders}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="按期执行"
                  value={data.orderExecution.onSchedule}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="延期订单"
                  value={data.orderExecution.delayed}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="紧急订单"
                  value={data.orderExecution.urgentOrders}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
};

export default Dashboard; 