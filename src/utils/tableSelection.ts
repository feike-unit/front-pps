/**
 * 表格选中行状态管理工具
 * 使用localStorage实现表格选中行的持久化存储
 */

// 存储前缀，避免键名冲突
const STORAGE_PREFIX = 'table_selection';

/**
 * 表格选中行管理工具类
 */
class TableSelectionManager {
  /**
   * 保存选中行ID
   * @param tableId 表格ID
   * @param rowId 选中行ID
   */
  saveSelectedRow(tableId: string, rowId: number | string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:${tableId}`, String(rowId));
    } catch (error) {
      console.error('保存表格选中行失败:', error);
    }
  }

  /**
   * 获取选中行ID
   * @param tableId 表格ID
   * @returns 选中行ID，如果没有则返回null
   */
  getSelectedRow(tableId: string): number | null {
    try {
      const value = localStorage.getItem(`${STORAGE_PREFIX}:${tableId}`);
      if (value) {
        const numValue = Number(value);
        return !isNaN(numValue) ? numValue : null;
      }
      return null;
    } catch (error) {
      console.error('获取表格选中行失败:', error);
      return null;
    }
  }

  /**
   * 清除选中行ID
   * @param tableId 表格ID
   */
  clearSelectedRow(tableId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}:${tableId}`);
    } catch (error) {
      console.error('清除表格选中行失败:', error);
    }
  }

  /**
   * 清除所有表格的选中状态
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('清除所有表格选中行失败:', error);
    }
  }
}

// 导出单例
export const tableSelection = new TableSelectionManager(); 