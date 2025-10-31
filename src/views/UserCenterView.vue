<template>
  <div class="user-center-container">
    <n-card class="user-card">
      <template #header>
        <div class="card-title-left">个人中心</div>
      </template>
      <template #header-extra>
        <n-space v-if="isLoggedIn">
          <!-- 编辑个人资料按钮 -->
          <n-button 
            text
            type="info"
            @click="handleEditProfileClick"
          >
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
            </n-icon>
            编辑个人资料
          </n-button>
          
          <n-button 
            text
            type="error"
            @click="handleLogout"
          >
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 17v-2h-3v-2h3v-2l5 3-5 3zM14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4h-2v4H6V4h8v4h2V4a2 2 0 0 0-2-2z"/></svg>
            </n-icon>
            退出登录
          </n-button>
        </n-space>
      </template>

      <div v-if="!isLoggedIn" class="unlogged-in-state">
        <n-empty description="请先登录以查看个人信息。"></n-empty>
        <n-button type="primary" @click="goToLogin" class="login-button">
          去登录
        </n-button>
      </div>

      <div v-else class="logged-in-state">
        <n-avatar round :size="100" class="user-avatar" :src="userInfo.avatar">
          <n-icon v-if="!userInfo.avatar">
            <n-svg-icon>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </n-svg-icon>
          </n-icon>
        </n-avatar>
        
        <h3 class="user-name">
          {{ username }} 
          <span v-if="userInfo.id" class="user-id">
            ID: {{ userInfo.id }}
            <n-tag 
              v-if="userInfo.is_admin === 1" 
              round 
              type="info" 
              class="admin-tag"
            >
              管理员
            </n-tag>
          </span>
        </h3>
        
        <p v-if="userInfo.balance !== undefined" class="user-balance">
          账户余额: ¥{{ userInfo.balance?.toFixed(2) }}
        </p>

        <p v-if="userInfo.qq_number" class="user-info-item">
          QQ号: {{ userInfo.qq_number }}
        </p>
        
        <div v-if="userInfo.is_admin === 1" class="admin-panel-link">
          <n-button 
            type="info" 
            @click="goToAdminPanel"
          >
            <n-icon class="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 16v-2h-3V8h-2v6h-3v2h8zM15 15.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            </n-icon>
            管理员面板
          </n-button>
        </div>
        
        <n-divider dashed>
          访客记录
        </n-divider>

        <div v-if="records.length > 0" class="records-list">
          <n-list bordered>
            <n-list-item v-for="record in records" :key="record.id">
              <template #prefix>
                <span :class="['record-status', record.status]">{{ record.status === 'ongoing' ? '进行中' : '已结束' }}</span>
              </template>
              <div class="record-content">
                <div class="record-info">
                  <n-ellipsis style="max-width: 200px">
                    订单ID: {{ record.order_id }}
                  </n-ellipsis>
                </div>
                <div v-if="record.out_time" class="record-info">
                  离店时间: {{ formatTime(record.out_time) }}
                </div>
                <div class="record-info">
                  进店时间: {{ formatTime(record.in_time) }}
                </div>
                <div v-if="record.status === 'finished' && record.amount_spent !== undefined" class="record-info record-amount-spent">
                  消费金额: ¥{{ record.amount_spent?.toFixed(2) }}
                </div>
              </div>
            </n-list-item>
          </n-list>
        </div>
        <n-empty v-else description="您还没有任何访客记录。"></n-empty>
      </div>
    </n-card>

    <!-- 编辑个人资料模态框 -->
    <n-modal
      v-model:show="showEditProfileModal"
      preset="dialog"
      title="编辑个人资料"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveProfile"
      @negative-click="handleCancelEditProfile"
      :mask-closable="false"
      :closable="false"
    >
      <n-form :model="editingProfile" label-placement="left" label-width="80px">
        <n-form-item label="头像URL">
          <n-input v-model:value="editingProfile.avatar" placeholder="请输入头像URL" />
        </n-form-item>
        <n-form-item>
          <n-space justify="start" style="width: 100%;">
            <n-button type="info" @click="promptForQQAvatar">使用QQ号作为头像</n-button>
            <n-button type="success" @click="setDefaultAvatar">使用默认头像</n-button>
          </n-space>
        </n-form-item>
      </n-form>

      <n-divider dashed style="margin: 20px 0;">修改密码</n-divider>

      <n-form :model="passwordForm" label-placement="left" label-width="80px">
        <n-form-item label="旧密码">
          <n-input 
            v-model:value="passwordForm.old_password" 
            type="password" 
            placeholder="请输入旧密码" 
            show-password-on="click" 
          />
        </n-form-item>
        <n-form-item label="新密码">
          <n-input 
            v-model:value="passwordForm.new_password" 
            type="password" 
            placeholder="请输入新密码" 
            show-password-on="click" 
          />
        </n-form-item>
        <n-form-item label="确认密码">
          <n-input 
            v-model:value="passwordForm.confirm_password" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password-on="click" 
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- QQ号输入模态框 -->
    <n-modal
      v-model:show="showQQInputModal"
      preset="dialog"
      title="输入QQ号码"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleQQInputConfirm"
      @negative-click="showQQInputModal = false"
      :mask-closable="false"
      :closable="false"
    >
      <n-input
        v-model:value="qqNumberInput"
        placeholder="请输入QQ号码"
        @keyup.enter="handleQQInputConfirm"
      />
    </n-modal>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { 
  NCard, NEmpty, NButton, NAvatar, NIcon, NSvgIcon, NDivider, useMessage, 
  NList, NListItem, NEllipsis, NTag, NSpace, NModal, NForm, NFormItem, NInput 
} from 'naive-ui'; 
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const userStore = useUserStore();
const router = useRouter();
const message = useMessage();

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const isLoggedIn = computed(() => userStore.isLoggedIn);
const username = computed(() => userStore.user?.username || '未登录用户');

const userInfo = ref({});
const records = ref([]);

// 状态用于编辑个人资料模态框
const showEditProfileModal = ref(false);
const editingProfile = ref({}); // 用于编辑用户名、QQ号、头像URL

// 状态用于密码修改表单
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
});

// 新增状态用于QQ号输入模态框
const showQQInputModal = ref(false);
const qqNumberInput = ref('');

const fetchUserInfo = async () => {
  const token = localStorage.getItem('user-token');
  if (!token) {
    userInfo.value = {};
    return;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/info`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    userInfo.value = response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    }
  }
};

const fetchRecords = async () => {
  const token = localStorage.getItem('user-token');
  if (!token) {
    records.value = [];
    return;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/records`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    records.value = response.data;
  } catch (error) {
    console.error('获取访客记录失败:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else {
      message.error('获取访客记录失败。');
    }
  }
};

const formatTime = (timestamp) => {
  const numericTimestamp = Number(timestamp);
  if (isNaN(numericTimestamp) || numericTimestamp <= 0) {
    return 'N/A';
  }
  const date = new Date(numericTimestamp * 1000); 
  return date.toLocaleString();
};

watchEffect(() => {
  if (isLoggedIn.value) {
    fetchUserInfo();
    fetchRecords();
  } else {
    userInfo.value = {};
    records.value = [];
  }
});

const goToLogin = () => {
  router.push('/login');
};

const handleLogout = () => {
  userStore.logout();
  message.success('已成功退出登录。');
  router.push('/login');
};

const goToAdminPanel = () => {
  router.push('/admin');
};

// 处理编辑个人资料按钮点击
const handleEditProfileClick = () => {
  // 复制当前用户信息到编辑表单
  editingProfile.value = { 
    avatar: userInfo.value.avatar || ''
  };
  // 重置密码表单
  passwordForm.value = {
    old_password: '',
    new_password: '',
    confirm_password: ''
  };
  showEditProfileModal.value = true;
};

// 保存个人资料修改 (仅处理头像URL)
const handleSaveProfile = async () => {
  let profileUpdated = false;
  let passwordChanged = false;

  try {
    // ---- 个人资料更新逻辑 (仅头像) ----
    const profileChanges = {};
    if (editingProfile.value.avatar !== userInfo.value.avatar) {
      profileChanges.avatar = editingProfile.value.avatar;
    }

    if (Object.keys(profileChanges).length > 0) {
      const token = localStorage.getItem('user-token');
      await axios.put(`${API_BASE_URL}/api/user/profile`, profileChanges, {
        headers: { Authorization: `Bearer ${token}` }
      });
      profileUpdated = true;
    }

    // ---- 密码修改逻辑 (前端验证) ----
    // 只有当至少一个密码字段被填写时才进行验证和尝试修改
    if (passwordForm.value.old_password || passwordForm.value.new_password || passwordForm.value.confirm_password) {
      // 验证密码字段
      if (!passwordForm.value.old_password) {
        message.error('请输入旧密码以修改密码。');
        return; // 验证失败，停止执行
      }
      if (!passwordForm.value.new_password || passwordForm.value.new_password.length < 6) {
        message.error('新密码不能少于6位。');
        return; // 验证失败，停止执行
      }
      if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
        message.error('两次输入的新密码不一致。');
        return; // 验证失败，停止执行
      }
      if (passwordForm.value.old_password === passwordForm.value.new_password) {
        message.error('新密码不能与旧密码相同。');
        return; // 验证失败，停止执行
      }

      // 密码验证通过，发送修改密码请求
      const token = localStorage.getItem('user-token');
      await axios.put(`${API_BASE_URL}/api/user/password-change`, {
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      passwordChanged = true;
    }

    // 根据更新情况显示消息
    if (profileUpdated && passwordChanged) {
      message.success('个人资料和密码更新成功！');
    } else if (profileUpdated) {
      message.success('个人资料更新成功！');
    } else if (passwordChanged) {
      message.success('密码更新成功！');
    } else {
      message.info('未进行任何更改。');
    }
    
    // 关闭模态框并刷新用户信息
    showEditProfileModal.value = false;
    await fetchUserInfo(); 
    // 如果密码修改成功，可能需要强制用户重新登录以使新密码生效
    if (passwordChanged) {
      userStore.logout();
      router.push('/login');
    }

  } catch (error) {
    console.error('保存个人资料或修改密码失败:', error);
    const errorMessage = error.response?.data?.error || '操作失败。';
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期或无权限，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else {
      message.error(errorMessage);
    }
  }
};

// 取消编辑个人资料
const handleCancelEditProfile = () => {
  showEditProfileModal.value = false;
};

// 使用QQ号作为头像 (现在显示 Naive UI 模态框)
const promptForQQAvatar = () => {
  qqNumberInput.value = ''; // 清空之前的输入
  showQQInputModal.value = true;
};

// 处理QQ号输入模态框的确认 (前端验证已在此处进行)
const handleQQInputConfirm = () => {
  const qqNumber = qqNumberInput.value;
  if (qqNumber) {
    // 简单的QQ号码验证 (5-11位数字，不以0开头)
    if (/^[1-9][0-9]{4,10}$/.test(qqNumber)) {
      editingProfile.value.avatar = `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=640`;
      showQQInputModal.value = false;
    } else {
      message.error('QQ号码格式不正确。');
      // 验证失败，不关闭模态框，让用户纠正输入
    }
  } else {
    message.error('请输入QQ号码。');
    // 验证失败，不关闭模态框，让用户纠正输入
  }
};

// 使用默认头像
const setDefaultAvatar = () => {
  editingProfile.value.avatar = '/img/user_avatar.jpg';
};
</script>

<style scoped>
.user-center-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 128px);
  padding-top: 20px;
}
.user-card {
  width: 100%;
  max-width: 500px;
  text-align: left;
  box-shadow: none;
  border: none;
}
.unlogged-in-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-button {
  margin-top: 20px;
}
.logged-in-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.user-avatar {
  margin-bottom: 10px;
}
.user-name {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.5em; 
  display: flex;
  align-items: center;
}
.user-id {
  font-size: 0.8em;
  color: #888;
  margin-left: 10px;
  font-weight: normal;
  display: flex;
  align-items: center;
}
.user-balance, .user-info-item { /* 样式应用于余额和新增的QQ号 */
  margin-top: -5px; 
  margin-bottom: 10px; /* 略微调整间距 */
  font-size: 1.2em;
  color: #333;
}
.records-list {
  width: 100%;
  text-align: left;
}
.record-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.record-info {
  font-size: 0.9em;
  color: #666;
}
.record-status {
  font-weight: bold;
}
.record-status.ongoing {
  color: #4CAF50; /* 绿色 */
}
.record-status.finished {
  color: #9E9E9E; /* 灰色 */
}
.admin-tag {
  margin-left: 8px;
}
.card-title-left {
  text-align: left;
}
.admin-panel-link {
  width: 100%;
  margin-bottom: 20px;
}
.admin-panel-link .n-button {
  width: 100%;
}
.button-icon {
  margin-right: 5px;
}
.record-amount-spent {
  color: #F44336;
  font-weight: bold;
}
</style>
