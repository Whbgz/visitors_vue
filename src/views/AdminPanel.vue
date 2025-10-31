<template>
  <div class="admin-panel-container">
    <n-layout has-sider class="admin-layout">
      <!-- 侧边导航栏 -->
      <n-layout-sider 
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger="arrow-circle"
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <div class="sidebar-header">
          <n-icon size="40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z"/></svg>
          </n-icon>
          <span v-if="!collapsed" class="header-text">管理员面板</span>
        </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeMenu"
          @update:value="handleMenuUpdate"
        />
      </n-layout-sider>

      <!-- 右侧主内容区域 -->
      <n-layout>
        <!-- 新增顶部栏 -->
        <n-layout-header bordered class="admin-header">
          <div class="user-info">
            <n-avatar round :size="40" class="user-avatar" :src="userStore.user?.avatar">
              <n-icon v-if="!userStore.user?.avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </n-icon>
            </n-avatar>
            <span class="username">{{ userStore.user?.username }}</span>
            <n-button 
              text
              type="error"
              class="logout-button"
              @click="handleLogout"
            >
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 17v-2h-3v-2h3v-2l5 3-5 3zM14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4h-2v4H6V4h8v4h2V4a2 2 0 0 0-2-2z"/></svg>
              </n-icon>
              <span class="logout-text">退出</span>
            </n-button>
          </div>
        </n-layout-header>
        <n-layout-content content-style="padding: 24px;">
          <router-view></router-view>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup>
import { h, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NLayout, NLayoutSider, NLayoutContent, NMenu, NIcon, NLayoutHeader, NAvatar, NButton, useMessage } from 'naive-ui';
import { 
  DashboardOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  PictureOutlined, 
  SettingOutlined, 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined
} from '@vicons/antd';
import { useUserStore } from '@/stores/user.js';

const router = useRouter();
const route = useRoute();
const message = useMessage();
const userStore = useUserStore();

const collapsed = ref(true);

const renderIcon = (icon) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

// 确保 activeMenu 能够匹配到路由
const activeMenu = computed(() => route.path);

const menuOptions = [
  {
    label: '仪表盘',
    key: '/admin/dashboard',
    icon: renderIcon(DashboardOutlined)
  },
  {
    label: '用户管理',
    key: '/admin/users',
    icon: renderIcon(UserOutlined)
  },
  {
    label: '所有订单',
    key: '/admin/orders/all',
    icon: renderIcon(FileTextOutlined)
  },
  {
    label: '入店订单',
    key: '/admin/orders/in-store',
    icon: renderIcon(ClockCircleOutlined) 
  },
  {
    label: '价格设置',
    key: '/admin/price-settings',
    icon: renderIcon(DollarCircleOutlined)
  },
  {
    label: '轮播图',
    key: '/admin/carousel',
    icon: renderIcon(PictureOutlined)
  },
  {
    label: '平台设置',
    key: '/admin/settings',
    icon: renderIcon(SettingOutlined)
  },
  {
    label: '返回用户页',
    key: '/user-center',
    icon: renderIcon(ArrowLeftOutlined)
  }
];

const handleMenuUpdate = (key) => {
  router.push(key);
};

const handleLogout = () => {
  userStore.logout();
  message.success('已成功退出登录。');
  router.push('/login');
};
</script>

<style scoped>
.admin-panel-container {
  height: 100vh;
  display: flex;
}
.admin-layout {
  width: 100%;
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 20px;
  color: var(--n-item-text-color-collapsed);
  background-color: var(--n-color-menu);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: background-color .3s var(--n-bezier),color .3s var(--n-bezier);
}
.header-text {
  margin-left: 10px;
  font-size: 18px;
  font-weight: bold;
}
.admin-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
}
.user-info {
  display: flex;
  align-items: center;
}
.user-avatar {
  margin-right: 12px;
}
.username {
  font-weight: bold;
  margin-right: 16px;
  color: #333;
}
.logout-button {
  margin-left: auto;
}
.logout-text {
  margin-left: 4px;
}
</style>
