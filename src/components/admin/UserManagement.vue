<template>
  <div class="user-management-container">
    <n-card :bordered="false" title="用户管理">
      <n-divider style="margin: 10px 0;"></n-divider>

      <n-space justify="end" style="margin-bottom: 20px;">
        <n-button type="primary" @click="fetchUsers" :loading="loading">
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </n-icon>
          刷新用户列表
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="users"
        :pagination="pagination"
        :loading="loading"
        :bordered="false"
        :empty-description="emptyDescription"
      />
    </n-card>

    <n-modal
      v-model:show="showEditModal"
      preset="dialog"
      title="编辑用户"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveEdit"
      @negative-click="showEditModal = false"
    >
      <n-form :model="editingUser" label-placement="left" label-width="80px">
        <n-form-item label="用户ID">
          <n-input v-model:value="editingUser.id" disabled />
        </n-form-item>
        <n-form-item label="用户名">
          <n-input v-model:value="editingUser.username" />
        </n-form-item>
        <n-form-item label="手机号">
          <n-input v-model:value="editingUser.phone_number" />
        </n-form-item>
        <n-form-item label="角色">
          <n-select
            v-model:value="editingUser.role"
            :options="roleOptions"
            placeholder="选择用户角色"
          />
        </n-form-item>
        <n-form-item label="余额">
          <n-input-number
            v-model:value="editingUser.balance"
            :precision="2"
            :min="0"
            style="width: 100%;"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="管理员">
          <n-switch v-model:value="editingUser.is_admin" :disabled="editingUser.id === 1">
            <template #checked>是</template>
            <template #unchecked>否</template>
          </n-switch>
        </n-form-item>
        <n-form-item label="活跃状态">
          <n-switch v-model:value="editingUser.is_active" :disabled="editingUser.id === 1">
            <template #checked>活跃</template>
            <template #unchecked>不活跃</template>
          </n-switch>
        </n-form-item>
        <n-form-item label="禁用状态">
          <n-switch v-model:value="editingUser.is_banned" :disabled="editingUser.id === 1">
            <template #checked>已禁用</template>
            <template #unchecked>未禁用</template>
          </n-switch>
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      type="warning"
      title="确认删除"
      :content="`确定要删除用户 ${deletingUser.username} (${deletingUser.id}) 吗？此操作不可逆。`"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirmDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { h, ref, onMounted } from 'vue';
import { 
  NCard, NDataTable, NButton, NIcon, NTag, NSpace, NDivider, 
  NModal, NForm, NFormItem, NInput, NInputNumber, NSwitch, NSelect, useMessage 
} from 'naive-ui'; 
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const users = ref([]);
const loading = ref(false);
const emptyDescription = ref('当前没有用户记录。');

const showEditModal = ref(false);
const editingUser = ref({}); 

const showDeleteConfirm = ref(false);
const deletingUserId = ref(null); 
const deletingUser = ref({}); 

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: 'TEST_BOT', value: 'TEST_BOT' },
  { label: '超级管理员', value: 'super_admin' },
];

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const numericTimestamp = Number(timestamp);
  if (isNaN(numericTimestamp)) {
    return 'N/A';
  }
  const date = new Date(numericTimestamp * 1000);
  return date.toLocaleString();
};

const handleStatusUpdate = async (row, key, value) => {
  if (row.id === 1) {
    message.warning('ID 为 1 的用户不允许被操作。');
    return;
  }
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }
    
    // 创建一个包含单个字段的更新对象
    const updateData = {};
    updateData[key] = value ? 1 : 0; // 将布尔值转换为整数
    
    await axios.put(`${API_BASE_URL}/api/admin/users/${row.id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 直接更新本地数据，避免重新加载整个列表
    row[key] = value;
    message.success(`${key === 'is_admin' ? '管理员' : key === 'is_active' ? '活跃' : '禁用'}状态更新成功！`);
    
  } catch (error) {
    console.error('更新用户状态失败:', error);
    const errorMessage = error.response?.data?.error || '更新用户状态失败。';
    message.error(errorMessage);
    // 失败时将开关状态恢复
    row[key] = !value;
  }
};

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
    sorter: (row1, row2) => row1.id - row2.id
  },
  {
    title: '用户名',
    key: 'username',
    width: 150,
    sorter: (row1, row2) => row1.username.localeCompare(row2.username)
  },
  {
    title: '手机号',
    key: 'phone_number',
    width: 150,
    render(row) {
      return row.phone_number || 'N/A';
    },
    sorter: (row1, row2) => (row1.phone_number || '').localeCompare(row2.phone_number || '')
  },
  {
    title: '角色',
    key: 'role',
    width: 120,
    render(row) {
      const roleMap = {
        'user': { text: '普通用户', type: 'info' },
        'TEST_BOT': { text: 'TEST_BOT', type: 'warning' },
        'super_admin': { text: '超级管理员', type: 'success' },
      };
      const tag = roleMap[row.role] || { text: row.role, type: 'default' };
      return h(NTag, { type: tag.type, bordered: false }, { default: () => tag.text });
    },
    sorter: (row1, row2) => row1.role.localeCompare(row2.role)
  },
  {
    title: '余额',
    key: 'balance',
    width: 100,
    render(row) {
      return `¥${row.balance?.toFixed(2) || '0.00'}`;
    },
    sorter: (row1, row2) => row1.balance - row2.balance
  },
  {
    title: '管理员',
    key: 'is_admin',
    width: 100,
    render(row) {
      return h(NSwitch, {
        value: row.is_admin,
        onUpdateValue: (value) => handleStatusUpdate(row, 'is_admin', value),
        disabled: row.id === 1 // 禁用ID为1的用户的开关
      });
    },
    sorter: (row1, row2) => row1.is_admin - row2.is_admin
  },
  {
    title: '活跃',
    key: 'is_active',
    width: 80,
    render(row) {
      return h(NSwitch, {
        value: row.is_active,
        onUpdateValue: (value) => handleStatusUpdate(row, 'is_active', value),
        disabled: row.id === 1 // 禁用ID为1的用户的开关
      });
    },
    sorter: (row1, row2) => row1.is_active - row2.is_active
  },
  {
    title: '禁用',
    key: 'is_banned',
    width: 80,
    render(row) {
      return h(NSwitch, {
        value: row.is_banned,
        onUpdateValue: (value) => handleStatusUpdate(row, 'is_banned', value),
        disabled: row.id === 1 // 禁用ID为1的用户的开关
      });
    },
    sorter: (row1, row2) => row1.is_banned - row2.is_banned
  },
  {
    title: '注册时间',
    key: 'created_at',
    width: 180,
    render(row) {
      return formatTime(row.created_at);
    },
    sorter: (row1, row2) => row1.created_at - row2.created_at
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      const isDeleteDisabled = row.id === 1;
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'primary',
            onClick: () => handleEditClick(row),
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            onClick: () => handleDeleteClick(row.id, row.username),
            disabled: isDeleteDisabled // 禁用ID为1的用户的删除按钮
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

const fetchUsers = async () => {
  loading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = response.data.map(user => ({
      ...user,
      is_admin: user.is_admin === 1,
      is_active: user.is_active === 1,
      is_banned: user.is_banned === 1
    }));
  } catch (error) {
    console.error('获取用户记录失败:', error);
    const errorMessage = error.response?.data?.error || '获取用户记录失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      message.error('您没有权限访问此资源或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
    users.value = [];
  } finally {
    loading.value = false;
  }
};

const handleEditClick = (user) => {
  editingUser.value = { ...user }; 
  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    await axios.put(`${API_BASE_URL}/api/admin/users/${editingUser.value.id}`, {
      username: editingUser.value.username,
      phone_number: editingUser.value.phone_number,
      role: editingUser.value.role,
      balance: editingUser.value.balance,
      is_admin: editingUser.value.is_admin ? 1 : 0,
      is_active: editingUser.value.is_active ? 1 : 0,
      is_banned: editingUser.value.is_banned ? 1 : 0
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('用户更新成功！');
    showEditModal.value = false;
    await fetchUsers();
  } catch (error) {
    console.error('更新用户失败:', error);
    const errorMessage = error.response?.data?.error || '更新用户失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleDeleteClick = (userId, username) => {
  if (userId === 1) {
    message.warning('ID 为 1 的用户不允许被删除。');
    return;
  }
  deletingUserId.value = userId;
  deletingUser.value = { id: userId, username: username };
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = async () => {
  try {
    loading.value = true;
    const token = userStore.token;
    await axios.delete(`${API_BASE_URL}/api/admin/users/${deletingUserId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('用户删除成功！');
    showDeleteConfirm.value = false;
    await fetchUsers();
  } catch (error) {
    console.error('删除用户失败:', error);
    const errorMessage = error.response?.data?.error || '删除用户失败。';
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}
</style>