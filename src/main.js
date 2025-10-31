// src/main.js

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import naive from 'naive-ui'; // 关键修改1: 导入整个 naive-ui 库
import { useUserStore } from '@/stores/user.js'; // 关键修改2: 导入 user store

const app = createApp(App);
const pinia = createPinia();

app.use(pinia); // 确保在路由之前使用 Pinia
app.use(router);
app.use(naive); // 关键修改3: 全局安装 naive-ui

// 关键修改4: 在应用挂载前，尝试恢复用户登录状态
const userStore = useUserStore(); // 获取 store 实例
if (userStore.isLoggedIn) {
  // 如果 localStorage 中有 token，尝试从后端获取用户详细信息
  userStore.fetchUserInfo().then(() => {
    // console.log('用户信息已恢复');
  }).catch((error) => {
    console.error('恢复用户信息失败:', error);
  });
}

// 关键修改5: 移除 app.component('message-provider', NMessageProvider);
// NMessageProvider 应该在 App.vue 中直接包裹 <router-view />

app.mount('#app');