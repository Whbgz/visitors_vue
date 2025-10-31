<template>
  <div class="all-order-management-container">
    <n-card :bordered="false" title="所有订单管理">
      <!-- 标题下方直接添加分隔线 -->
      <n-divider style="margin: 10px 0;"></n-divider>

      <!-- 将搜索和筛选控件移到卡片内容区，并用 n-space 包裹 -->
      <n-space wrap justify="start" :size="[12, 12]" style="margin-bottom: 20px;" class="search-filter-controls">
        <!-- 模糊搜索输入框 -->
        <n-input
          v-model:value="searchTerm"
          placeholder="搜索订单ID、用户名或用户ID"
          clearable
          style="flex-grow: 1; min-width: 180px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
            </n-icon>
          </template>
        </n-input>

        <!-- 状态筛选器 -->
        <n-select
          v-model:value="statusFilter"
          :options="statusOptions"
          placeholder="筛选订单状态"
          clearable
          style="flex-grow: 1; min-width: 150px;"
          @update:value="handleSearch"
        />

        <!-- 时间筛选器 -->
        <n-date-picker
          v-model:value="dateRange"
          type="datetimerange"
          clearable
          placeholder="筛选创建时间范围"
          :shortcuts="dateShortcuts"
          style="flex-grow: 1; min-width: 280px;"
          @update:value="handleSearch"
        />

        <n-button type="primary" @click="handleSearch" :loading="loading" style="flex-shrink: 0;">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
            </n-icon>
          </template>
          搜索
        </n-button>

        <n-button type="default" @click="resetFiltersAndSearch" :loading="loading" style="flex-shrink: 0;">
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </n-icon>
          </template>
          重置
        </n-button>
      </n-space>

      <n-divider style="margin: 10px 0;"></n-divider>

      <n-data-table
        :columns="columns"
        :data="allOrders"
        :pagination="pagination"
        :loading="loading"
        :bordered="false"
        :empty-description="emptyDescription"
      />
    </n-card>

    <!-- 编辑订单模态框 -->
    <n-modal
      v-model:show="showEditModal"
      preset="dialog"
      title="编辑订单"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveEdit"
      @negative-click="showEditModal = false"
    >
      <n-form :model="editingOrder" label-placement="left" label-width="80px">
        <n-form-item label="订单ID">
          <n-input v-model:value="editingOrder.id" disabled /> <!-- 显示 session_order_id -->
        </n-form-item>
        <n-form-item label="用户名称">
          <n-input v-model:value="editingOrder.user_name" disabled />
        </n-form-item>
        <n-form-item label="订单类型">
          <n-input :value="getOrderItemType(editingOrder.items)" disabled /> <!-- 动态显示订单类型 -->
        </n-form-item>
        <n-form-item label="商品名称">
          <!-- 关键修改: 移除 disabled 属性，使商品名称可编辑 -->
          <n-input v-model:value="editingOrder.items" type="textarea" :autosize="{ minRows: 1, maxRows: 3 }" /> 
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="editingOrder.status"
            :options="statusOptions.filter(opt => opt.value !== null)"
            placeholder="选择订单状态"
          />
        </n-form-item>
        <n-form-item label="总金额"> <!-- 标签改为总金额 -->
          <n-input-number
            v-model:value="editingOrder.total_amount"
            :precision="2"
            :min="0"
            style="width: 100%;"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 删除确认模态框 -->
    <n-modal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      type="warning"
      title="确认删除"
      content="确定要删除此订单记录吗？此操作不可逆。"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirmDelete"
      @negative-click="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { h, ref, onMounted } from 'vue';
import { NCard, NDataTable, NButton, NIcon, NTag, NInput, NDatePicker, NSelect, NSpace, NDivider, NModal, NForm, NFormItem, NInputNumber, useMessage } from 'naive-ui';
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const allOrders = ref([]);
const loading = ref(false);
const emptyDescription = ref('当前没有符合条件的订单记录。');

// 筛选和搜索状态
const searchTerm = ref('');
const statusFilter = ref(null);
const dateRange = ref(null); // [start_timestamp_ms, end_timestamp_ms]

// 模态框状态
const showEditModal = ref(false);
const editingOrder = ref({});
const showDeleteConfirm = ref(false);
const deletingOrderId = ref(null);

const statusOptions = [
  { label: '所有状态', value: null },
  { label: '待处理', value: 'pending' }, // 更改状态选项以匹配 orders 表
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
];

// 日期选择器快捷方式
const dateShortcuts = {
  '今天': () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return [startOfDay.getTime(), endOfDay.getTime()];
  },
  '昨天': () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    return [startOfYesterday.getTime(), endOfYesterday.getTime()];
  },
  '最近7天': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6); 
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start.getTime(), end.getTime()];
  },
  '最近30天': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29); 
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start.getTime(), end.getTime()];
  }
};

// 辅助函数：格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const numericTimestamp = Number(timestamp);
  if (isNaN(numericTimestamp)) {
    return 'N/A';
  }
  const date = new Date(numericTimestamp * 1000);
  return date.toLocaleString();
};

// 辅助函数：获取订单项目类型
const getOrderItemType = (itemsJsonString) => {
  if (!itemsJsonString) return '商品订单';
  try {
    const items = JSON.parse(itemsJsonString);
    if (Array.isArray(items) && items.length > 0 && items[0].type) {
      return `${items[0].type}订单`;
    }
    return '商品订单';
  } catch (e) {
    console.error('解析订单类型失败:', e);
    return '商品订单';
  }
};

// 辅助函数：解析 items 字段，根据类型显示
const parseItems = (itemsJsonString) => {
  if (!itemsJsonString) return '无商品';
  try {
    const items = JSON.parse(itemsJsonString);
    if (Array.isArray(items) && items.length > 0) {
      const firstItem = items[0];
      if (firstItem.type === '入店' && firstItem.details) {
        return firstItem.details; // 对于入店类型，显示 details 字段
      }
      // 对于其他类型或没有 details 的，显示 name x quantity
      return items.map(item => `${item.name} x${item.quantity || 1}`).join(', ');
    }
    return '无商品';
  } catch (e) {
    console.error('解析商品列表失败:', e);
    return '解析失败';
  }
};

// 表格列配置
const columns = [
  {
    title: '订单ID',
    key: 'id', // 现在对应后端返回的 session_order_id
    minWidth: 160,
    sorter: (row1, row2) => row1.id.localeCompare(row2.id) // 字符串比较
  },
  {
    title: '用户名称',
    key: 'user_name',
    width: 120,
    sorter: (row1, row2) => row1.user_name.localeCompare(row2.user_name)
  },
  {
    title: '订单类型',
    key: 'order_type',
    width: 100,
    render(row) {
      return h(NTag, { type: 'info', bordered: false }, { default: () => getOrderItemType(row.items) });
    }
  },
  {
    title: '商品名称',
    key: 'items',
    minWidth: 200,
    render(row) {
      return parseItems(row.items);
    }
  },
  {
    title: '状态', 
    key: 'status',
    width: 100,
    render(row) {
      const statusMap = {
        'pending': { text: '待处理', type: 'warning' },
        'completed': { text: '已完成', type: 'success' },
        'cancelled': { text: '已取消', type: 'error' }
      };
      const tag = statusMap[row.status] || { text: row.status, type: 'default' };
      return h(NTag, { type: tag.type, bordered: false }, { default: () => tag.text });
    },
    sorter: (row1, row2) => row1.status.localeCompare(row2.status)
  },
  {
    title: '总金额', // 列标题改为总金额
    key: 'total_amount', // 对应 orders 表的 total_amount 字段
    width: 120,
    render(row) {
      return `¥${row.total_amount?.toFixed(2) || '0.00'}`;
    },
    sorter: (row1, row2) => row1.total_amount - row2.total_amount
  },
  {
    title: '创建时间', // 列标题改为创建时间
    key: 'order_time', // 对应 orders 表的 order_time 字段
    width: 180,
    render(row) {
      return formatTime(row.order_time);
    },
    sorter: (row1, row2) => row1.order_time - row2.order_time
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'primary',
            onClick: () => handleEditClick(row)
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            onClick: () => handleDeleteClick(row.order_db_id) // 删除操作使用实际数据库ID
          }, { default: () => '删除' })
        ]
      });
    }
  }
];

// 分页配置
const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30]
};

// 获取所有订单数据
const fetchAllOrders = async () => {
  loading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const queryParams = new URLSearchParams();
    if (searchTerm.value) {
      queryParams.append('search_term', searchTerm.value);
    }
    if (statusFilter.value) {
      queryParams.append('status', statusFilter.value);
    }
    if (dateRange.value && dateRange.value[0]) {
      queryParams.append('start_time', Math.floor(dateRange.value[0] / 1000));
    }
    if (dateRange.value && dateRange.value[1]) {
      queryParams.append('end_time', Math.floor(dateRange.value[1] / 1000));
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/orders/all?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    allOrders.value = response.data;
  } catch (error) {
    console.error('获取所有订单失败:', error);
    const errorMessage = error.response?.data?.error || '获取所有订单失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      message.error('您没有权限访问此资源或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
    allOrders.value = [];
  } finally {
    loading.value = false;
  }
};

// 触发搜索
const handleSearch = () => {
  fetchAllOrders();
};

// 重置筛选并搜索
const resetFiltersAndSearch = () => {
  searchTerm.value = '';
  statusFilter.value = null;
  dateRange.value = null;
  fetchAllOrders();
};

// 处理编辑按钮点击
const handleEditClick = (order) => {
  // 复制订单数据，同时存储实际数据库ID和显示ID
  editingOrder.value = { 
    ...order, 
    db_id: order.order_db_id, // 存储实际的数据库ID用于PUT/DELETE
    id: order.id // 存储用于显示的订单ID (session_order_id)
  }; 
  showEditModal.value = true;
};

// 保存编辑后的订单
const handleSaveEdit = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    // 发送 total_amount, status 和 items 到后端，使用实际的数据库ID (db_id)
    await axios.put(`${API_BASE_URL}/api/admin/all-orders/${editingOrder.value.db_id}`, { // 关键修改: 更新API路径
      status: editingOrder.value.status,
      total_amount: editingOrder.value.total_amount,
      items: editingOrder.value.items, // 关键修改: 发送 items 字段
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('订单更新成功！');
    showEditModal.value = false;
    await fetchAllOrders(); 
  } catch (error) {
    console.error('更新订单失败:', error);
    const errorMessage = error.response?.data?.error || '更新订单失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 处理删除按钮点击
const handleDeleteClick = (orderDbId) => { // 接收实际数据库ID
  deletingOrderId.value = orderDbId;
  showDeleteConfirm.value = true;
};

// 确认删除订单
const handleConfirmDelete = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    // 使用实际的数据库ID (deletingOrderId.value) 发送删除请求
    await axios.delete(`${API_BASE_URL}/api/admin/all-orders/${deletingOrderId.value}`, { // 关键修改: 更新API路径
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('订单删除成功！');
    showDeleteConfirm.value = false;
    await fetchAllOrders(); 
  } catch (error) {
    console.error('删除订单失败:', error);
    const errorMessage = error.response?.data?.error || '删除订单失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchAllOrders();
});
</script>

<style scoped>
.all-order-management-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}

/* 确保搜索和筛选控件能够响应式布局 */
.search-filter-controls {
  display: flex;
  flex-wrap: wrap; /* 允许元素换行 */
  gap: 12px;       /* 元素之间的间距 */
  justify-content: flex-start; /* 默认左对齐，如果需要靠右，可修改 */
  width: 100%; /* 确保 n-space 本身占据全宽 */
}

/* 针对手机端布局的样式调整 (覆盖桌面端默认样式) */
@media (max-width: 768px) {
  .search-filter-controls {
    flex-direction: column !important; /* 强制垂直堆叠其内部控件 */
    align-items: stretch !important;   /* 拉伸以占据全部宽度 */
    justify-content: flex-start !important;
    gap: 12px !important; /* 确保移动端也有垂直间距 */
  }

  /* 确保 Naive UI 组件在小屏幕上占据全部宽度，并防止收缩 */
  .search-filter-controls .n-input,
  .search-filter-controls .n-select,
  .search-filter-controls .n-date-picker,
  .search-filter-controls .n-button {
    width: 100% !important; /* 强制占据 100% 宽度 */
    min-width: 0 !important; /* 防止内容收缩，确保宽度生效 */
    max-width: none !important; /* 移除桌面端的最大宽度限制 */
    flex: none !important; /* 在移动端禁用 flex 弹性，直接使用 width */
    box-sizing: border-box; /* 确保 padding/border 不会导致溢出 */
  }

  /* 针对 Naive UI 内部可能存在的 flex 或 width 限制的更强力覆盖 */
  .search-filter-controls .n-input .n-input__input, 
  .search-filter-controls .n-select .n-base-selection, 
  .search-filter-controls .n-date-picker .n-input, 
  .search-filter-controls .n-date-picker .n-input__input-el
  {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
