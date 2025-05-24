import React, { useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
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
  const handleSubmit = async (values: LoginForm) => {
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
      <LoginForm
        title="福佑计划管理系统"
        subTitle="欢迎回来！请登录您的账户"
        loading={loading}
        initialValues={{
          username: 'admin',
          password: 'admin123',
        }}
        onFinish={async (values) => {
          await handleSubmit(values as LoginForm);
        }}
      >
        <ProFormText
          name="username"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined className={'prefixIcon'} />,
          }}
          placeholder={'用户名'}
          rules={[
            {
              required: true,
              message: '请输入用户名!',
            },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
          }}
          placeholder={'密码'}
          rules={[
            {
              required: true,
              message: '请输入密码！',
            },
          ]}
        />
      </LoginForm>
    </div>
  );
};

export default Login; 