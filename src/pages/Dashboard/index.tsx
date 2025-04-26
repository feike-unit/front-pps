import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

// 仪表盘组件
// 展示系统关键指标的统计数据
const Dashboard: React.FC = () => {
  return (
    <div>
      <h2>仪表盘</h2>
      {/* 统计卡片网格布局 */}
      <Row gutter={16}>
        {/* 用户统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={112}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        {/* 项目总数统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={93}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        {/* 已完成项目统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成项目"
              value={45}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        {/* 进行中项目统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中项目"
              value={48}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 