// src/stores/user.js

import { defineStore } from 'pinia';
import axios from 'axios'; // 确保导入 axios

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL; // 确保获取环境变量

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('user-token') || null,
    user: null, // 用户信息，例如 { id, username, isAdmin, avatar, balance }
    isLoggedIn: !!localStorage.getItem('user-token')
  }),
  actions: {
    login(token) {
      this.token = token;
      this.isLoggedIn = true;
      localStorage.setItem('user-token', token);
      // 登录后，我们会在 main.js 或其他地方调用 fetchUserInfo 来设置 this.user
    },
    logout() {
      this.token = null;
      this.user = null;
      this.isLoggedIn = false;
      localStorage.removeItem('user-token');
    },
    // 新增：从后端获取用户详细信息的动作
    async fetchUserInfo() {
      if (!this.token) {
        this.logout(); // 如果没有 token，确保处于登出状态
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user/info`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        this.user = response.data; // 设置用户详细信息
        this.isLoggedIn = true; // 成功获取信息后，确认登录状态
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 如果 token 过期或无效，强制登出
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          this.logout();
        }
      }
    },
    // 用于直接设置用户数据，例如在登录成功时
    setUser(userData) {
      this.user = userData;
    }
  },
});