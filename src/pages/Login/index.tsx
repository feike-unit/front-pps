import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';
import styles from './index.module.css';

// 登录表单数据接口定义
interface LoginForm {
  username: string;
  password: string;
}

// 登录页面组件
const Login: React.FC = () => {
  // 路由导航hook
  const navigate = useNavigate();
  // 登录加载状态
  const [loading, setLoading] = useState(false);

  // 表单提交处理函数
  const onFinish = async (values: LoginForm) => {
    try {
      setLoading(true);
      // 调用登录API
      await login(values);
      message.success('登录成功');
      // 登录成功后跳转到仪表盘
      navigate('/dashboard');
    } catch (error: any) {
      // 登录失败错误处理
      const errorMessage = error.response?.data?.message || error.message || '登录失败，请重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="企业计划管理系统" className={styles.loginCard}>
        <Form
          name="login"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={onFinish}
          size="large"
        >
          {/* 用户名输入框 */}
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          {/* 密码输入框 */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          {/* 登录按钮 */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 