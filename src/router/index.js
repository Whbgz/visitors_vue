import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import CheckInView from '../views/CheckInView.vue';
import UserCenterView from '../views/UserCenterView.vue';
import AdminPanel from '@/views/AdminPanel.vue'; 
// 导入所有管理员子组件
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import UserManagement from '@/components/admin/UserManagement.vue';
import CarouselSettings from '@/components/admin/CarouselSettings.vue';
import PlatformSettings from '@/components/admin/PlatformSettings.vue';
// 导入订单子管理组件
import InStoreOrderManagement from '@/components/admin/InStoreOrderManagement.vue';
import AllOrderManagement from '@/components/admin/AllOrderManagement.vue'; 
// 导入价格设置组件
import PriceSettings from '@/components/admin/PriceSettings.vue';

// 导入 Pinia 和 Axios
import { useUserStore } from '@/stores/user.js';
import axios from 'axios';

const routes = [
  // 主框架路由
  {
    path: '/',
    name: 'home',
    component: HomeView,
    children: [
      {
        path: '',
        redirect: '/check-in'
      },
      {
        path: '/check-in',
        name: 'check-in',
        component: CheckInView
      },
      {
        path: '/user-center',
        name: 'user-center',
        component: UserCenterView
      },
      {
        path: '/login',
        name: 'login',
        component: LoginView
      },
      {
        path: '/register',
        name: 'register',
        component: RegisterView
      }
    ]
  },
  // 管理员面板路由
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    redirect: '/admin/dashboard', 
    meta: { requiresAdmin: true }, // 访问此路由需要管理员权限
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: UserManagement
      },
      // 添加“所有订单”路由
      {
        path: 'orders/all', 
        name: 'AdminAllOrders',
        component: AllOrderManagement // 指向 AllOrderManagement 组件
      },
      // “入店订单”路由作为单独的子路由
      {
        path: 'orders/in-store', 
        name: 'AdminInStoreOrders',
        component: InStoreOrderManagement 
      },
      {
        path: 'price-settings',
        name: 'AdminPriceSettings',
        component: PriceSettings 
      },
      {
        path: 'carousel',
        name: 'AdminCarousel',
        component: CarouselSettings
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: PlatformSettings
      }
    ]
  },
  // 404 页面路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 导航守卫
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const token = userStore.token;

    // 检查目标路由是否需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (!token) {
        return next('/login');
      }

      try {
        const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
        const response = await axios.get(`${API_BASE_URL}/api/admin/check-admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.is_admin === 1) {
          next();
        } else {
          // 后端返回 200 但非管理员，导航到 404
          console.warn('Backend returned 200 but not an admin, navigating to 404.');
          next({ name: 'NotFound' }); 
        }
      } catch (error) {
        // 如果 token 无效、过期或发生其他错误，导航到 404 页面
        console.error('Admin permission verification failed, navigating to 404 page:', error.message);
        next({ name: 'NotFound' }); 
      }
    } else {
        next();
    }
});

export default router;
