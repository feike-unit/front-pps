import React, { useEffect, useState } from 'react';
import { Modal, Select, message } from 'antd';
import { getUsers } from '@/services/user';
import { User } from '@/types/user';

interface AssignUsersModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (selectedUserIds: number[]) => void;
  departmentId?: number;
}

const AssignUsersModal: React.FC<AssignUsersModalProps> = ({
  open,
  onCancel,
  onOk,
  departmentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers({
        pageNum: 1,
        pageSize: 100, // 设置一个较大的数值以获取更多用户
        keyword: '',
      });
      setUsers(response.data.list); // 使用分页响应中的 list 数组
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUserIds([]);
    }
  }, [open]);

  const handleOk = () => {
    onOk(selectedUserIds);
  };

  return (
    <Modal
      title="分配用户"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        placeholder="请选择用户"
        loading={loading}
        value={selectedUserIds}
        onChange={(value) => setSelectedUserIds(value)}
        options={(users || []).map((user) => ({
          label: `${user.username} (${user.name}) - ${user.email}`,
          value: user.id,
        }))}
      />
    </Modal>
  );
};

export default AssignUsersModal; 