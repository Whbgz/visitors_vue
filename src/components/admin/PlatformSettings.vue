<template>
  <div class="platform-settings-container">
    <n-card :bordered="false" title="平台设置">
      <n-form
        ref="formRef"
        :model="settings"
        :rules="rules"
        label-placement="left"
        label-width="120px"
        style="max-width: 600px; margin: 0 auto;"
      >
        <n-form-item label="默认单价 (元/小时)" path="default_price">
          <n-input-number
            v-model:value="settings.default_price"
            :min="0.01"
            :precision="2"
            style="width: 100%;"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="免费时长 (分钟)" path="free_duration_minutes">
          <n-input-number
            v-model:value="settings.free_duration_minutes"
            :min="0"
            :precision="0"
            style="width: 100%;"
          >
            <template #suffix>分钟</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="客服联系方式" path="customer_service_contact">
          <n-input
            v-model:value="settings.customer_service_contact"
            placeholder="请输入客服联系方式"
            type="textarea"
            :rows="3"
          />
        </n-form-item>
        <!-- 关键修改: 添加账户审批开关 -->
        <n-form-item label="账户需要审批" path="account_approval_required">
          <n-switch v-model:value="settings.account_approval_required">
            <template #checked>需要</template>
            <template #unchecked>不需要</template>
          </n-switch>
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            @click="handleSave"
            :loading="isLoading"
            style="width: 120px;"
          >
            保存设置
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { NCard, NForm, NFormItem, NInputNumber, NInput, NButton, NSwitch, useMessage } from 'naive-ui'; // 关键修改: 导入 NSwitch
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const formRef = ref(null);
const isLoading = ref(false);
const settings = ref({
  default_price: 5.00,
  free_duration_minutes: 5,
  customer_service_contact: '19237480125',
  account_approval_required: false // 关键修改: 新增字段并设置默认值
});

const rules = {
  default_price: {
    required: true,
    type: 'number',
    trigger: ['input', 'blur'],
    message: '请输入有效的默认单价（至少0.01）',
    validator: (rule, value) => value >= 0.01
  },
  free_duration_minutes: {
    required: true,
    type: 'number',
    trigger: ['input', 'blur'],
    message: '请输入有效的免费时长（至少0）',
    validator: (rule, value) => value >= 0
  },
  customer_service_contact: {
    required: true,
    trigger: ['input', 'blur'],
    message: '请输入客服联系方式'
  },
  // 关键修改: 账户审批开关的规则 (通常只需要检查是否存在)
  account_approval_required: {
    required: true,
    type: 'boolean',
    trigger: ['change'],
    message: '请选择账户审批状态'
  }
};

const fetchSettings = async () => {
  isLoading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/settings/platform`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // 关键修改: 确保将 0/1 转换为布尔值
    settings.value = {
      ...response.data,
      account_approval_required: response.data.account_approval_required === 1
    };
  } catch (error) {
    console.error('获取平台设置失败:', error);
    const errorMessage = error.response?.data?.error || '获取平台设置失败。';
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      message.error('您没有权限访问此资源或登录已过期。');
      userStore.logout();
    } else {
      message.error(errorMessage);
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      isLoading.value = true;
      try {
        const token = userStore.token;
        if (!token) {
          message.error('未登录或登录信息已过期，请重新登录。');
          userStore.logout();
          return;
        }

        // 关键修改: 将布尔值转换为 0/1 发送到后端
        const settingsToSave = {
          ...settings.value,
          account_approval_required: settings.value.account_approval_required ? 1 : 0
        };

        await axios.put(`${API_BASE_URL}/api/admin/settings/platform`, settingsToSave, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('平台设置保存成功！');
      } catch (error) {
        console.error('保存平台设置失败:', error);
        const errorMessage = error.response?.data?.error || '保存平台设置失败。';
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          message.error('您没有权限执行此操作或登录已过期。');
          userStore.logout();
        } else {
          message.error(errorMessage);
        }
      } finally {
        isLoading.value = false;
      }
    } else {
      message.error('请检查表单填写是否正确。');
    }
  });
};

onMounted(() => {
  fetchSettings();
});
</script>

<style scoped>
.platform-settings-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}
</style>
