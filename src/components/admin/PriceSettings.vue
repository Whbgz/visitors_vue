<template>
  <div class="price-settings-container">
    <n-card :bordered="false" title="价格设置">
      <template #header-extra>
        <n-button type="primary" @click="handleAddClick">
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </n-icon>
          添加价格规则
        </n-button>
      </template>

      <n-divider style="margin: 10px 0;"></n-divider>

      <n-data-table
        :columns="columns"
        :data="priceRules"
        :pagination="pagination"
        :loading="loading"
        :bordered="false"
        :empty-description="emptyDescription"
      />
    </n-card>

    <!-- 添加/编辑价格规则模态框 -->
    <n-modal
      v-model:show="showModal"
      preset="dialog"
      :title="isEditing ? '编辑价格规则' : '添加价格规则'"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSavePriceRule"
      @negative-click="handleCancelEdit"
    >
      <n-form :model="currentPriceRule" label-placement="left" label-width="100px">
        <n-form-item label="星期">
          <n-select
            v-model:value="currentPriceRule.day_of_week"
            :options="dayOfWeekOptions"
            placeholder="选择星期"
            multiple
          />
        </n-form-item>
        <n-form-item label="开始时间">
          <n-time-picker
            v-model:formatted-value="currentPriceRule.start_time"
            format="HH:mm"
            placeholder="选择开始时间"
            value-format="HH:mm"
            style="width: 100%;"
          />
        </n-form-item>
        <n-form-item label="结束时间">
          <n-time-picker
            v-model:formatted-value="currentPriceRule.end_time"
            format="HH:mm"
            placeholder="选择结束时间"
            value-format="HH:mm"
            style="width: 100%;"
          />
        </n-form-item>
        <n-form-item label="每小时价格">
          <n-input-number
            v-model:value="currentPriceRule.price_per_hour"
            :precision="2"
            :min="0.01"
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
      content="确定要删除此价格规则吗？此操作不可逆。"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirmDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { h, ref, onMounted, computed } from 'vue';
import { 
  NCard, NDataTable, NButton, NIcon, NSpace, NDivider, 
  NModal, NForm, NFormItem, NInputNumber, NSelect, NTimePicker, useMessage 
} from 'naive-ui';
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const priceRules = ref([]);
const loading = ref(false);
const emptyDescription = ref('当前没有价格规则。');

// 模态框状态
const showModal = ref(false); 
const showDeleteConfirm = ref(false);

// 当前正在编辑/添加的规则
const currentPriceRule = ref({
  id: null,
  day_of_week: [], 
  start_time: '00:00', 
  end_time: '23:59',   
  price_per_hour: 10.00
});

const isEditing = computed(() => currentPriceRule.value.id !== null);

// 删除相关
const deletingRuleId = ref(null);

// 星期选项
const dayOfWeekOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 } 
];

// 辅助函数：格式化星期
const formatDayOfWeek = (days) => {
  if (!days || days.length === 0) return '所有天';
  if (days.length === 7) return '所有天';
  
  const sortedDays = [...days].sort((a, b) => a - b); 
  
  const customOrder = (day) => {
    if (day === 0) return 7; 
    return day;
  };
  sortedDays.sort((a, b) => customOrder(a) - customOrder(b));

  const dayMap = {
    0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六'
  };
  return sortedDays.map(day => dayMap[day]).join(', ');
};


const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
    sorter: (row1, row2) => row1.id - row2.id
  },
  {
    title: '星期',
    key: 'day_of_week',
    width: 150,
    render(row) {
      // 数据库存储的是 JSON 字符串，需要解析
      const days = JSON.parse(row.day_of_week || '[]');
      return formatDayOfWeek(days);
    }
  },
  {
    title: '开始时间',
    key: 'start_time',
    width: 100
  },
  {
    title: '结束时间',
    key: 'end_time',
    width: 100
  },
  {
    title: '每小时价格',
    key: 'price_per_hour',
    width: 120,
    render(row) {
      return `¥${row.price_per_hour?.toFixed(2)}`;
    },
    sorter: (row1, row2) => row1.price_per_hour - row2.price_per_hour
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

// 获取价格规则数据
const fetchPriceRules = async () => {
  loading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/price-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    priceRules.value = response.data;
  } catch (error) {
    console.error('获取价格规则失败:', error);
    const errorMessage = error.response?.data?.error || '获取价格规则失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) { // 关键修改: 捕获 403 错误
      message.error('您没有权限访问此资源或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
    priceRules.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAddClick = () => {
  resetForm(); 
  showModal.value = true;
};

const handleEditClick = (rule) => {
  currentPriceRule.value = { 
    ...rule, 
    day_of_week: JSON.parse(rule.day_of_week || '[]') 
  };
  showModal.value = true; 
};

const handleSavePriceRule = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    const ruleToSave = { 
      ...currentPriceRule.value,
      day_of_week: JSON.stringify(currentPriceRule.value.day_of_week) 
    };

    if (isEditing.value) {
      await axios.put(`${API_BASE_URL}/api/admin/price-settings/${ruleToSave.id}`, ruleToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('价格规则更新成功！');
    } else {
      await axios.post(`${API_BASE_URL}/api/admin/price-settings`, ruleToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('价格规则添加成功！');
    }
    resetForm();
    await fetchPriceRules();
  } catch (error) {
    console.error('保存价格规则失败:', error);
    const errorMessage = error.response?.data?.error || '保存价格规则失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) { // 关键修改: 捕获 403 错误
      message.error('您没有权限执行此操作或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const handleDeleteClick = (ruleId) => {
  deletingRuleId.value = ruleId;
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    await axios.delete(`${API_BASE_URL}/api/admin/price-settings/${deletingRuleId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('价格规则删除成功！');
    showDeleteConfirm.value = false;
    await fetchPriceRules();
  } catch (error) {
    console.error('删除价格规则失败:', error);
    const errorMessage = error.response?.data?.error || '删除价格规则失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) { // 关键修改: 捕获 403 错误
      message.error('您没有权限执行此操作或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

const handleCancelEdit = () => {
  resetForm(); 
};

const resetForm = () => {
  showModal.value = false; 
  currentPriceRule.value = {
    id: null,
    day_of_week: [],
    start_time: '00:00',
    end_time: '23:59',
    price_per_hour: 10.00
  };
};

onMounted(() => {
  fetchPriceRules();
});
</script>

<style scoped>
.price-settings-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}
</style>
