<template>
  <div class="register-container">
    <n-card class="form-card" title="新用户注册">
      <template #header-extra>
        <n-button type="primary" text @click="goToLogin">
          去登录
        </n-button>
      </template>

      <n-form ref="registerFormRef" :model="formValue" :rules="rules">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formValue.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="formValue.phone" placeholder="请输入手机号" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formValue.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        <n-button type="primary" block @click="handleRegister">注册</n-button>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import axios from 'axios';

const router = useRouter();
const message = useMessage();

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const registerFormRef = ref(null);
const formValue = ref({
  username: '',
  phone: '',
  password: ''
});

const rules = {
  username: { 
    required: true, 
    message: '请输入用户名', 
    trigger: 'blur',
    validator(rule, value) {
      if (!value) {
        return new Error('请输入用户名');
      } else if (value.length < 5) {
        return new Error('用户名不能少于5位');
      }
      return true;
    }
  },
  password: { 
    required: true, 
    message: '请输入密码', 
    trigger: 'blur',
    validator(rule, value) {
      if (!value) {
        return new Error('请输入密码');
      } else if (value.length < 6) {
        return new Error('密码不能少于6位');
      }
      return true;
    }
  },
  // 关键修改：更新手机号验证规则
  phone: { 
    required: true, 
    trigger: 'blur',
    validator(rule, value) {
      if (!value) {
        return new Error('请输入手机号');
      }
      // 使用正则表达式验证手机号格式
      const phoneRegex = /^1[0-9]{10}$/;
      if (!phoneRegex.test(value)) {
        return new Error('手机号格式不正确');
      }
      return true;
    }
  }
};

const handleRegister = () => {
  registerFormRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/register`, {
          username: formValue.value.username,
          phone: formValue.value.phone,
          password: formValue.value.password
        });
        message.success(response.data.message);
        router.push('/login');
      } catch (error) {
        const errorMessage = error.response?.data?.error || '注册失败，请稍后再试。';
        message.error(errorMessage);
      }
    }
  });
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  /* 关键修改：将垂直对齐方式改为顶部对齐 */
  align-items: flex-start; 
  min-height: calc(100vh - 128px);
  padding-top: 20px; /* 增加一点顶部间距，避免紧贴屏幕边缘 */
}

.form-card {
  width: 100%;
  max-width: 400px;
  box-shadow: none;
  border: none;
}
</style>