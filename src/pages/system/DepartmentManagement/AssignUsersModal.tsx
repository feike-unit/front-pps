import React, { useEffect, useState } from 'react';
import { Modal, Transfer, message } from 'antd';
import type { TransferDirection, TransferProps } from 'antd/es/transfer';
import type { Key } from 'antd/es/table/interface';
import { getDepartmentUsers, assignUsersToDepartment } from '../../../services/department';
import { getUsers } from '../../../services/user';
import { ApiError } from '../../../services/api';
import { User } from '../../../types/user';

interface AssignUsersModalProps {
  open: boolean;
  departmentId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferUser {
  key: Key;
  title: string;
  description: string;
}

const AssignUsersModal: React.FC<AssignUsersModalProps> = ({
  open,
  departmentId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TransferUser[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  // 获取所有用户和部门已分配的用户
  const fetchData = async () => {
    if (!departmentId) return;
    
    setLoading(true);
    try {
      const [allUsers, departmentUsers] = await Promise.all([
        getUsers({ pageNum: 1, pageSize: 1000, keyword: '' }),
        getDepartmentUsers(departmentId),
      ]);

      // 转换用户数据为 Transfer 需要的格式
      const transferUsers = allUsers.list.map((user: User) => ({
        key: user.id,
        title: user.username,
        description: user.nickname || user.username,
      }));
      setUsers(transferUsers);

      // 设置已选中的用户
      setSelectedKeys(departmentUsers);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '获取用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && departmentId) {
      fetchData();
    }
  }, [open, departmentId]);

  const handleChange = (targetKeys: Key[], direction: TransferDirection, moveKeys: Key[]) => {
    setSelectedKeys(targetKeys);
  };

  const handleOk = async () => {
    if (!departmentId) return;
    
    try {
      await assignUsersToDepartment(departmentId, selectedKeys.map(key => Number(key)));
      message.success('用户分配成功');
      onSuccess();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || apiError.message || '分配用户失败');
    }
  };

  return (
    <Modal
      title="分配用户"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      width={800}
      confirmLoading={loading}
    >
      <Transfer<TransferUser>
        dataSource={users}
        titles={['未分配用户', '已分配用户']}
        targetKeys={selectedKeys}
        onChange={handleChange}
        render={item => item.title}
        listStyle={{
          width: 300,
          height: 400,
        }}
      />
    </Modal>
  );
};

export default AssignUsersModal; 