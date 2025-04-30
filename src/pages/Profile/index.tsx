import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { getProfile} from '../../services/auth';
import { updateUserProfile, updateUserPassword } from '../../services/auth';
import type { UserInfo } from '../../services/user';
import styles from './index.module.css';

const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const result = await getProfile();
      if (result) {
        setUserInfo(result);
        form.setFieldsValue({
          name: result.name,
          email: result.email,
          phone: result.phone,
        });
      }
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      await updateUserProfile(values);
      message.success('个人信息更新成功');
      fetchUserInfo(); // 重新获取用户信息
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      await updateUserPassword(values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.profileCard}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            className={styles.form}
          >
            <Form.Item
              name="name"
              label="姓名"
              rules={[
                { required: true, message: '请输入姓名' },
                { min: 2, max: 50, message: '姓名长度必须在2-50个字符之间' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="修改密码" key="2">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            className={styles.form}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请确认新密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default Profile; 