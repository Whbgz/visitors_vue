<template>
  <div class="login-container">
    <n-card class="form-card" title="用户登录">
      <n-form ref="loginFormRef" :model="formValue" :rules="rules">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formValue.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formValue.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        <n-button type="primary" block @click="handleLogin">登录</n-button>
        <n-button class="register-link" text @click="goToRegister">没有账号？点击注册</n-button>
      </n-form>
    </n-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const loginFormRef = ref(null);
const formValue = ref({
  username: '',
  password: ''
});

// 验证规则
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
  }
};

const handleLogin = () => {
  loginFormRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, formValue.value);
        
        const { token } = response.data;
        
        userStore.login(token);
        await userStore.fetchUserInfo();

        message.success('登录成功！');
        
        // 关键修改：移除管理员判断，所有用户都重定向到 /check-in
        router.push('/check-in');

      } catch (error) {
        const errorMessage = error.response?.data?.error || '登录失败，请稍后再试。';
        message.error(errorMessage);
      }
    }
  });
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.form-card {
  width: 100%;
  max-width: 400px;
  box-shadow: none;
  border: none;
}
.register-link {
  margin-top: 10px;
}
</style>