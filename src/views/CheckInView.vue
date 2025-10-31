<template>
  <div class="check-in-container">
    <!-- 轮播图区域 (通过接口获取图片，并在获取后渲染) -->
    <div class="carousel-wrapper" v-if="carouselImages.length > 0"> <!-- 只有当有图片时才渲染 -->
      <n-carousel 
        autoplay 
        show-arrow 
        :interval="3000" 
        effect="fade"
        class="main-carousel" 
      >
        <n-carousel-item v-for="(image, index) in carouselImages" :key="index">
          <img
            class="carousel-img"
            :src="image.image_url"
            :alt="'轮播图' + (index + 1)"
            onerror="console.error('图片加载失败，使用默认图片:', this.src); this.onerror=null;this.src='/img/Maimai_DX_PRiSM_PLUS.webp';"
          />
        </n-carousel-item>
      </n-carousel>
    </div>

    <n-card class="card">
      <h2 class="section-title">访客进店</h2>
      <n-alert v-if="!isLoggedIn" title="未登录" type="warning" class="alert-message">
        请先登录，以便记录您的访客信息。
      </n-alert>
      <n-alert v-else :title="alertTitle" :type="alertType" class="alert-message">
        您好，{{ username }}！
      </n-alert>
      
      <!-- 未登录状态下显示入场单价 (不显示免费时长) -->
      <div class="user-info" v-if="!isLoggedIn">
        <p><strong>当前入场单价:</strong> ¥{{ currentEntryPrice?.toFixed(2) || '0.00' }}/小时</p>
      </div>

      <!-- 已登录但不在店状态下显示账户余额和入场单价 -->
      <div v-else-if="isLoggedIn && !inStoreStatus.is_in_store" class="user-info">
        <p><strong>账户余额:</strong> ¥{{ userInfo.balance?.toFixed(2) }}</p>
        <p><strong>当前入场单价:</strong> ¥{{ currentEntryPrice?.toFixed(2) || '0.00' }}/小时</p> 
      </div>

      <!-- 已登录且在店状态下显示账户余额、计费单价、入场至今时长和预估结算金额 -->
      <div v-else-if="isLoggedIn && inStoreStatus.is_in_store" class="user-info">
        <p><strong>账户余额:</strong> ¥{{ userInfo.balance?.toFixed(2) }}</p>
        <p><strong>当前计费单价:</strong> ¥{{ inStoreStatus.unit_price?.toFixed(2) || '0.00' }}/小时</p>
        <p v-if="durationInStoreMinutes !== null"><strong>入场至今时长:</strong> {{ durationInStoreMinutes }} 分钟</p>
        <p><strong>预估结算金额:</strong> ¥{{ inStoreStatus.estimated_cost?.toFixed(2) || '0.00' }}</p>
        <p class="status-text">
          <strong>在店状态:</strong>
          <span class="status-in">您已在店</span>
        </p>
      </div>

      <n-button 
        type="success" 
        block 
        @click="handleButtonClick" 
        :class="['action-button', { 'depart-button': inStoreStatus.is_in_store }]"
        :disabled="isLoading"
      >
        {{ buttonText }}
      </n-button>
    </n-card>

    <!-- 进店确认弹窗 -->
    <n-modal
      v-model:show="showArriveConfirmModal"
      preset="dialog"
      title="确认进店"
      positive-text="确定进店"
      negative-text="取消"
      @positive-click="confirmArrive"
      @negative-click="showArriveConfirmModal = false"
    >
      <p>当前计费单价：<strong>¥{{ currentEntryPrice?.toFixed(2) || '0.00' }}/小时</strong></p>
      <p v-if="freeDurationMinutes > 0">在 <strong>{{ freeDurationMinutes }} 分钟</strong>内离场免费。</p>
      <p>确定要进店吗？</p>
    </n-modal>

    <!-- 离店确认弹窗 -->
    <n-modal
      v-model:show="showDepartConfirmModal"
      preset="dialog"
      title="确认离店结算"
      positive-text="确定离店"
      negative-text="取消"
      @positive-click="confirmDepart"
      @negative-click="showDepartConfirmModal = false"
    >
      <p v-if="departConfirmation.duration !== null">您已在店 <strong>{{ departConfirmation.duration }} 分钟</strong>。</p>
      <p v-if="departConfirmation.estimatedCost !== null">预估结算金额：<strong>¥{{ departConfirmation.estimatedCost?.toFixed(2) || '0.00' }}</strong></p>
      <p>确定要离店结算吗？</p>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'; 
import { NCard, NAlert, NButton, useMessage, NModal, NCarousel, NCarouselItem } from 'naive-ui'; 
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const router = useRouter(); 

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const isLoggedIn = computed(() => userStore.isLoggedIn);
const username = computed(() => userStore.user?.username || '');

const userInfo = ref({});
const inStoreStatus = ref({
  is_in_store: false,
  order_id: null,
  unit_price: 0.00, 
  estimated_cost: 0.00, 
});
const currentEntryPrice = ref(0.00); 
const freeDurationMinutes = ref(0); 

const durationInStoreMinutes = ref(null); 

const isLoading = ref(false);
const showArriveConfirmModal = ref(false); 
const showDepartConfirmModal = ref(false); // 关键修改: 离店确认弹窗状态
const departConfirmation = ref({ // 关键修改: 离店确认弹窗的数据
  duration: null,
  estimatedCost: null,
  orderId: null,
});

let statusPollingInterval = null; 

const carouselImages = ref([]); 

const alertTitle = computed(() => (inStoreStatus.value.is_in_store ? '已在店' : '已登录'));
const alertType = computed(() => (inStoreStatus.value.is_in_store ? 'info' : 'success'));

const buttonText = computed(() => {
  if (!isLoggedIn.value) {
    return '登录';
  }
  return inStoreStatus.value.is_in_store ? '离店结算' : '访客进店';
});

const handleButtonClick = () => {
  if (!isLoggedIn.value) {
    goToLogin();
  } else if (inStoreStatus.value.is_in_store) {
    // 关键修改: 显示离店确认弹窗而不是直接离店
    showDepartConfirmation(); 
  } else {
    showArriveConfirmModal.value = true;
  }
};

const fetchStatusOnly = async () => {
  const token = localStorage.getItem('user-token');
  if (!token) return;

  try {
    const statusResponse = await axios.get(`${API_BASE_URL}/api/user/status`, { headers: { Authorization: `Bearer ${token}` } });
    inStoreStatus.value = statusResponse.data;

    if (inStoreStatus.value.is_in_store) {
      const inTimeSeconds = Number(inStoreStatus.value.in_time);
      const currentTimeSeconds = Math.floor(Date.now() / 1000);
      let durationSeconds = currentTimeSeconds - inTimeSeconds;
      if (durationSeconds < 0) durationSeconds = 0;
      durationInStoreMinutes.value = Math.ceil(durationSeconds / 60);
    } else {
      durationInStoreMinutes.value = null; 
    }
  } catch (error) {
    console.error('获取实时在店状态失败:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    }
  }
};

const fetchCarouselImages = async () => {
  try {
    // 关键修改: 恢复为 /api/home_img 路径
    const response = await axios.get(`${API_BASE_URL}/api/home_img`); 
    if (Array.isArray(response.data) && response.data.length > 0) {
      carouselImages.value = response.data;
    } else {
      carouselImages.value = [{ image_url: '/img/Maimai_DX_PRiSM_PLUS.webp' }];
      console.warn('API未返回首页轮播图，使用本地默认图片。');
    }
  } catch (error) {
    console.error('获取首页轮播图失败:', error);
    carouselImages.value = [{ image_url: '/img/Maimai_DX_PRiSM_PLUS.webp' }];
    message.warning('无法获取首页轮播图，将显示默认图片。');
  }
};

const fetchData = async () => {
  const token = localStorage.getItem('user-token');
  
  try {
    isLoading.value = true;
    
    const priceResponse = await axios.get(`${API_BASE_URL}/api/current-price`);
    currentEntryPrice.value = priceResponse.data.price; 
    freeDurationMinutes.value = priceResponse.data.free_duration_minutes;

    await fetchCarouselImages();

    if (token) {
      const [userInfoResponse, statusResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/user/info`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/user/status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      userInfo.value = userInfoResponse.data;
      inStoreStatus.value = statusResponse.data; 

      if (inStoreStatus.value.is_in_store) {
        const inTimeSeconds = Number(inStoreStatus.value.in_time);
        const currentTimeSeconds = Math.floor(Date.now() / 1000);
        let durationSeconds = currentTimeSeconds - inTimeSeconds;
        if (durationSeconds < 0) durationSeconds = 0;
        durationInStoreMinutes.value = Math.ceil(durationSeconds / 60);
      } else {
        durationInStoreMinutes.value = null; 
      }

    } else {
      userInfo.value = {};
      inStoreStatus.value = { is_in_store: false, order_id: null, unit_price: 0.00, estimated_cost: 0.00 }; 
      durationInStoreMinutes.value = null; 
    }

  } catch (error) {
    console.error('获取数据失败:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else if (error.request && !error.response) { 
      message.error('网络连接失败或服务器无响应。');
    } else {
      message.error('获取信息失败，请稍后再试。');
    }
    userInfo.value = {};
    inStoreStatus.value = { is_in_store: false, order_id: null, unit_price: 0.00, estimated_cost: 0.00 };
    currentEntryPrice.value = 5.00; 
    freeDurationMinutes.value = 5; 
    durationInStoreMinutes.value = null; 
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

watchEffect(() => {
  if (isLoggedIn.value && inStoreStatus.value.is_in_store) {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }
    statusPollingInterval = setInterval(() => {
      fetchStatusOnly(); 
    }, 60 * 1000); 
  } else {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      statusPollingInterval = null;
    }
  }
});

onUnmounted(() => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }
});

const confirmArrive = async () => {
  showArriveConfirmModal.value = false; 
  isLoading.value = true;
  try {
    const token = localStorage.getItem('user-token');
    if (!token) {
      message.error('未登录，无法访客进店。');
      isLoading.value = false;
      return;
    }
    const response = await axios.post(
      `${API_BASE_URL}/api/user/arrive`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200 && response.data.code === 'BALANCE_INSUFFICIENT') {
      message.error('进店失败：余额不足一小时时长扣费'); 
    } else if (response.status === 201) {
      message.success('访客进店记录成功！');
      await fetchData(); 
    } else {
      message.error(response.data.message || '记录失败，请稍后再试。');
    }

  } catch (error) {
    console.error('访客进店记录失败:', error);
    const errorMessage = error.response?.data?.error || '记录失败，请稍后再试。';
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else if (error.request && !error.response) {
      message.error('网络连接失败或服务器无响应。');
    } else {
      message.error(errorMessage);
    }
  } finally {
    isLoading.value = false;
  }
};

// 关键修改: 显示离店确认弹窗
const showDepartConfirmation = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('user-token');
    if (!token) {
      message.error('未登录，无法离店结算。');
      isLoading.value = false;
      return;
    }

    // 获取最新的在店状态和预估费用
    const statusResponse = await axios.get(`${API_BASE_URL}/api/user/status`, { headers: { Authorization: `Bearer ${token}` } });
    const currentInStoreStatus = statusResponse.data;

    if (currentInStoreStatus.is_in_store) {
      departConfirmation.value.orderId = currentInStoreStatus.order_id;
      departConfirmation.value.duration = durationInStoreMinutes.value; // 使用页面已计算的实时时长
      departConfirmation.value.estimatedCost = currentInStoreStatus.estimated_cost;
      showDepartConfirmModal.value = true;
    } else {
      // 如果此时用户已经不在店，直接刷新数据并提示
      message.warning('您当前不在店内，无需离店结算。');
      await fetchData();
    }

  } catch (error) {
    console.error('获取离店确认信息失败:', error);
    const errorMessage = error.response?.data?.error || '获取离店信息失败，请稍后再试。';
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else {
      message.error(errorMessage);
    }
  } finally {
    isLoading.value = false;
  }
};


// 关键修改: 确认离店的逻辑
const confirmDepart = async () => {
  showDepartConfirmModal.value = false; 
  isLoading.value = true;
  try {
    const token = localStorage.getItem('user-token');
    if (!token) {
      message.error('未登录，无法离店结算。');
      isLoading.value = false;
      return;
    }
    const orderId = departConfirmation.value.orderId;
    if (!orderId) {
      message.error('未找到进行中的订单，无法离店结算。');
      isLoading.value = false; 
      return;
    }
    await axios.post(
      `${API_BASE_URL}/api/user/leave`,
      { order_id: orderId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    message.success('离店结算成功！');
    await fetchData(); 
  } catch (error) {
    const errorMessage = error.response?.data?.error || '结算失败，请稍后再试。';
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录凭证已过期，请重新登录。');
      userStore.logout();
      router.push('/login');
    } else if (error.request && !error.response) {
      message.error('网络连接失败或服务器无响应。');
    } else {
      message.error(errorMessage);
    }
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.check-in-container {
  display: flex;
  flex-direction: column; /* 垂直排列子元素 */
  align-items: center;
  min-height: calc(100vh - 128px);
  padding-top: 20px; /* 顶部留白 */
  width: 100%; /* 占据全部宽度 */
}
.carousel-wrapper {
  width: 100%;
  max-width: 800px; /* 轮播图最大宽度 */
  margin-bottom: 20px; /* 轮播图与卡片之间留白 */
  border-radius: 8px; /* 圆角 */
  overflow: hidden; /* 隐藏超出边界的内容 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  background-color: #f0f0f0; /* 一个浅灰色背景 */
  border: 1px solid #e0e0e0; /* 一个浅灰色边框 */
}
/* 确保 n-carousel 组件本身有高度 */
.main-carousel {
  height: 180px; /* 调整为更矮的高度 */
}
/* 确保每个轮播项都占据 100% 宽度和高度 */
.main-carousel :deep(.n-carousel__slide) {
  width: 100%;
  height: 100%;
  display: flex; /* 使用 flex 布局辅助图片居中 */
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0; /* 轮播项的背景色与外部容器一致 */
}
/* 轮播图图片样式 */
.carousel-img {
  width: 100%;
  height: 100%; /* 图片高度也设置为 100% */
  object-fit: contain; /* 确保图片完整显示，不裁剪 */
  display: block; /* 移除图片底部空白 */
}
.card {
  width: 100%;
  max-width: 500px;
  text-align: center;
  margin-top: 0; /* 确保卡片不会因为轮播图而有额外顶部间距 */
}
.section-title {
  font-size: 1.5em;
  margin-bottom: 20px;
}
.alert-message {
  margin-bottom: 20px;
}
.user-info {
  margin-top: 20px;
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 10px;
}
.user-info p {
  margin: 5px 0;
}
.status-text {
  color: #3f51b5;
}
.status-in {
  font-weight: bold;
}
.action-button {
  margin-top: 20px;
}
.depart-button {
  background-color: #f44336 !important;
}
</style>
