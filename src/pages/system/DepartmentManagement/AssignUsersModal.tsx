import React, { useEffect, useState } from 'react';
import { Modal, Transfer, message } from 'antd';
import type { TransferDirection, TransferProps } from 'antd/es/transfer';
import type { Key } from 'antd/es/table/interface';
import { getDepartmentUsers, assignUsersToDepartment } from '../../../services/department';
import { getUnassignedDepartmentUsers } from '../../../services/user';
import { ApiError } from '../../../services/api';

interface User {
  id: number;
  username: string;
  name?: string;
  nickname?: string;
}

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
      // 获取未分配用户和当前部门已分配用户
      const [unassignedUsers, departmentUsers] = await Promise.all([
        getUnassignedDepartmentUsers(),
        getDepartmentUsers(departmentId),
      ]);

      // 合并未分配用户和已分配用户
      const allUsers = [...unassignedUsers, ...departmentUsers];

      // 转换用户数据为 Transfer 需要的格式
      const transferUsers = allUsers.map((user: User) => ({
        key: user.id,
        title: user.name || user.username,
        description: user.name || user.username,
      }));
      setUsers(transferUsers);

      // 设置已选中的用户（当前部门的用户）
      const selectedUserIds = departmentUsers.map(user => user.id);
      setSelectedKeys(selectedUserIds);
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
    
    // 检查是否有已分配用户
    if (selectedKeys.length === 0) {
      message.warning('请至少分配一个用户');
      return;
    }
    
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