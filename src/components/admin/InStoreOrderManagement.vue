<template>
  <div class="in-store-order-management-container">
    <n-card :bordered="false" title="入店订单">
      <!-- 标题下方直接添加分隔线 -->
      <n-divider style="margin: 10px 0;"></n-divider>

      <!-- 将搜索控件移到卡片内容区，并用 n-space 包裹 -->
      <n-space wrap justify="start" :size="[12, 12]" style="margin-bottom: 20px;">
        <!-- 订单ID模糊搜索 -->
        <n-input
          v-model:value="orderIdSearchTerm"
          placeholder="搜索订单ID"
          clearable
          style="width: 180px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
            </n-icon>
          </template>
        </n-input>

        <!-- 用户名称模糊搜索 -->
        <n-input
          v-model:value="userNameSearchTerm"
          placeholder="搜索用户名称"
          clearable
          style="width: 180px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
            </n-icon>
          </template>
        </n-input>

        <!-- 用户ID精确搜索 -->
        <n-input
          v-model:value="userIdSearchTerm"
          placeholder="搜索用户ID"
          clearable
          style="width: 150px;"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
            </n-icon>
          </template>
        </n-input>

        <!-- 时间筛选器 -->
        <n-date-picker
          v-model:value="dateRange"
          type="datetimerange"
          clearable
          placeholder="筛选入店时间范围"
          :shortcuts="dateShortcuts"
          style="flex-grow: 1; min-width: 280px;"
          @update:value="handleSearch"
        />

        <!-- 搜索按钮 -->
        <n-button type="primary" @click="handleSearch" :loading="loading">
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 17 10.5C17 7.42 14.58 5 11.5 5S6 7.42 6 10.5 8.42 16 11.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 7 12.99 7 11.5S8.01 9 9.5 9 12 10.01 12 11.5 10.99 14 9.5 14z"/></svg>
          </n-icon>
          搜索
        </n-button>

        <!-- 重置并刷新按钮 -->
        <n-button type="default" @click="resetFiltersAndSearch" :loading="loading">
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </n-icon>
          重置
        </n-button>
      </n-space>

      <!-- 在搜索区域和表格之间再次添加分隔线 -->
      <n-divider style="margin: 10px 0;"></n-divider>

      <n-data-table
        :columns="columns"
        :data="inStoreOrders"
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
      <n-form :model="editingOrder" label-placement="left" label-width="100px"> <!-- 关键修改: label-width 调整 -->
        <n-form-item label="订单ID">
          <n-input v-model:value="editingOrder.order_id" disabled />
        </n-form-item>
        <n-form-item label="用户名称">
          <n-input v-model:value="editingOrder.user_name" disabled />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="editingOrder.status"
            :options="statusOptions"
            placeholder="选择订单状态"
          />
        </n-form-item>
        <n-form-item label="花费余额">
          <n-input-number
            v-model:value="editingOrder.amount_spent"
            :precision="2"
            :min="0"
            style="width: 100%;"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="计价价格">
          <n-input-number
            v-model:value="editingOrder.unit_price"
            :precision="2"
            :min="0"
            style="width: 100%;"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <!-- 关键修改: 添加总入店时长编辑项 -->
        <n-form-item label="总入店时长">
          <n-input-number
            v-model:value="editingOrder.total_duration_minutes"
            :min="0"
            :precision="0"
            style="width: 100%;"
          >
            <template #suffix>分钟</template>
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
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { h, ref, onMounted, onUnmounted } from 'vue'; // 关键修改: 导入 onUnmounted
import { 
  NCard, NDataTable, NButton, NIcon, NTag, NInput, NDatePicker, NSpace, NDivider, 
  NModal, NForm, NFormItem, NInputNumber, NSelect, useMessage 
} from 'naive-ui'; 
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const inStoreOrders = ref([]);
const loading = ref(false);
const emptyDescription = ref('当前没有符合条件的订单记录。');

const orderIdSearchTerm = ref('');
const userNameSearchTerm = ref('');
const userIdSearchTerm = ref('');
const dateRange = ref(null);

const showEditModal = ref(false);
const editingOrder = ref({}); 

const showDeleteConfirm = ref(false);
const deletingOrderId = ref(null); 

const statusOptions = [
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'finished' }
];

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

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const numericTimestamp = Number(timestamp);
  if (isNaN(numericTimestamp)) {
    return 'N/A';
  }
  const date = new Date(numericTimestamp * 1000);
  return date.toLocaleString();
};

// 辅助函数：根据订单状态和时间计算显示时长
const calculateDisplayDuration = (row) => {
  if (row.status === 'ongoing') {
    if (!row.in_time) return 'N/A';
    const inTimeSeconds = Number(row.in_time);
    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    let durationSeconds = currentTimeSeconds - inTimeSeconds;
    if (durationSeconds < 0) durationSeconds = 0; // 避免负值
    return `${Math.ceil(durationSeconds / 60)} 分钟 (实时)`; // 向上取整到分钟
  } else if (row.status === 'finished') {
    return row.total_duration_minutes !== undefined && row.total_duration_minutes !== null 
           ? `${row.total_duration_minutes} 分钟` 
           : 'N/A';
  }
  return 'N/A';
};

// 关键修改: 实时更新进行中订单的时长显示
let durationUpdateInterval = null;

const columns = [
  {
    title: '订单ID',
    key: 'order_id',
    minWidth: 120, 
    sorter: (row1, row2) => row1.order_id.localeCompare(row2.order_id)
  },
  {
    title: '用户名称',
    key: 'user_name',
    width: 120,
    sorter: (row1, row2) => row1.user_name.localeCompare(row2.user_name)
  },
  {
    title: '入店时间',
    key: 'in_time',
    width: 180,
    render(row) {
      return formatTime(row.in_time);
    },
    sorter: (row1, row2) => row1.in_time - row2.in_time
  },
  {
    title: '离店时间',
    key: 'out_time',
    width: 180,
    render(row) {
      return row.out_time ? formatTime(row.out_time) : '未离店';
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap = {
        'ongoing': { text: '进行中', type: 'info' },
        'finished': { text: '已结束', type: 'success' }
      };
      const tag = statusMap[row.status] || { text: row.status, type: 'default' };
      return h(NTag, { type: tag.type, bordered: false }, { default: () => tag.text });
    },
    sorter: (row1, row2) => row1.status.localeCompare(row2.status)
  },
  {
    title: '总入店时长', 
    key: 'total_duration_minutes',
    width: 140, // 调整宽度以适应 " (实时)" 后缀
    render(row) {
      return calculateDisplayDuration(row); // 使用辅助函数
    },
    // 注意：对于进行中的订单，排序可能不如实时计算的显示直观，但仍基于原始数据
    sorter: (row1, row2) => {
      const duration1 = row1.status === 'finished' ? (row1.total_duration_minutes || 0) : (Math.ceil(((Date.now() / 1000) - Number(row1.in_time || Date.now()/1000)) / 60));
      const duration2 = row2.status === 'finished' ? (row2.total_duration_minutes || 0) : (Math.ceil(((Date.now() / 1000) - Number(row2.in_time || Date.now()/1000)) / 60));
      return duration1 - duration2;
    }
  },
  {
    title: '花费余额',
    key: 'amount_spent',
    width: 120,
    render(row) {
      return `¥${row.amount_spent?.toFixed(2) || '0.00'}`;
    },
    sorter: (row1, row2) => row1.amount_spent - row2.amount_spent
  },
  {
    title: '计价价格',
    key: 'unit_price',
    width: 120,
    render(row) {
      return `¥${row.unit_price?.toFixed(2) || '0.00'}`;
    },
    sorter: (row1, row2) => row1.unit_price - row2.unit_price
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
            onClick: () => handleDeleteClick(row.id)
          }, { default: () => '删除' })
        ]
      });
    }
  }
];

const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30]
};

const fetchInStoreOrders = async () => {
  loading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const queryParams = new URLSearchParams();
    if (orderIdSearchTerm.value) {
      queryParams.append('order_id_search', orderIdSearchTerm.value);
    }
    if (userNameSearchTerm.value) {
      queryParams.append('user_name_search', userNameSearchTerm.value);
    }
    if (userIdSearchTerm.value) {
      queryParams.append('user_id_search', userIdSearchTerm.value);
    }

    if (dateRange.value && dateRange.value[0]) {
      queryParams.append('start_time', Math.floor(dateRange.value[0] / 1000));
    }
    if (dateRange.value && dateRange.value[1]) {
      queryParams.append('end_time', Math.floor(dateRange.value[1] / 1000));
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/orders/in-store?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    inStoreOrders.value = response.data;
  } catch (error) {
    console.error('获取订单记录失败:', error);
    const errorMessage = error.response?.data?.error || '获取订单记录失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      message.error('您没有权限访问此资源或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
    inStoreOrders.value = [];
  } finally {
    loading.value = false;
  }
};

const handleEditClick = (order) => {
  // 对于进行中的订单，编辑弹窗的 total_duration_minutes 应该显示实时计算的值，而不是数据库中的 0
  // 但保存时，我们仍然只保存用户输入的值
  const currentDuration = order.status === 'ongoing' && order.in_time
    ? Math.ceil((Date.now() / 1000 - Number(order.in_time)) / 60)
    : (order.total_duration_minutes || 0);

  editingOrder.value = { 
    ...order, 
    total_duration_minutes: currentDuration // 关键修改: 编辑时预填充实时计算或已存储的时长
  }; 
  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    await axios.put(`${API_BASE_URL}/api/admin/orders/${editingOrder.value.id}`, {
      status: editingOrder.value.status,
      amount_spent: editingOrder.value.amount_spent,
      unit_price: editingOrder.value.unit_price,
      total_duration_minutes: editingOrder.value.total_duration_minutes 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('订单更新成功！');
    showEditModal.value = false;
    await fetchInStoreOrders(); 
  } catch (error) {
    console.error('更新订单失败:', error);
    const errorMessage = error.response?.data?.error || '更新订单失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleDeleteClick = (orderId) => {
  deletingOrderId.value = orderId;
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    await axios.delete(`${API_BASE_URL}/api/admin/orders/${deletingOrderId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('订单删除成功！');
    showDeleteConfirm.value = false;
    await fetchInStoreOrders(); 
  } catch (error) {
    console.error('删除订单失败:', error);
    const errorMessage = error.response?.data?.error || '删除订单失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchInStoreOrders();
};

const resetFiltersAndSearch = () => {
  orderIdSearchTerm.value = '';
  userNameSearchTerm.value = '';
  userIdSearchTerm.value = '';
  dateRange.value = null;
  fetchInStoreOrders();
};

onMounted(() => {
  fetchInStoreOrders();
  // 启动一个定时器，每分钟强制更新一次表格数据，以刷新“进行中”订单的实时时长显示
  durationUpdateInterval = setInterval(() => {
    // 仅更新数据，不重新加载所有订单，避免API频繁请求
    // 强制 Vue 重新渲染表格的 duration 列
    inStoreOrders.value = [...inStoreOrders.value]; 
  }, 60 * 1000); // 每分钟更新一次
});

onUnmounted(() => {
  if (durationUpdateInterval) {
    clearInterval(durationUpdateInterval);
  }
});
</script>

<style scoped>
.in-store-order-management-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}
</style>
