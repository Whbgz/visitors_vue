<template>
  <div class="admin-dashboard-container">
    <n-grid x-gap="24" y-gap="24" :cols="3">
      <!-- 左侧：垂直轮播图 -->
      <n-gi :span="1">
        <n-card :bordered="false" title="仪表盘轮播图" class="dashboard-card"> <!-- 关键修改: 标题更具体 -->
          <template #header-extra>
            <n-button text type="primary" @click="fetchCarouselImages" :loading="carouselLoading">
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
              </n-icon>
              刷新
            </n-button>
          </template>
          <n-spin :show="carouselLoading">
            <div class="carousel-wrapper">
              <n-carousel
                direction="vertical"
                effect="fade"
                autoplay
                :interval="3000"
                dot-type="line"
                show-arrow
                class="vertical-carousel"
              >
                <n-carousel-item v-for="(image, index) in carouselImages" :key="index">
                  <img
                    class="carousel-img"
                    :src="image.image_url"
                    :alt="'轮播图' + (index + 1)"
                    onerror="this.onerror=null;this.src='/img/Maimai_DX_PRiSM_PLUS.webp';"
                  />
                </n-carousel-item>
              </n-carousel>
            </div>
            <n-empty v-if="carouselImages.length === 0 && !carouselLoading" description="暂无轮播图"></n-empty>
          </n-spin>
        </n-card>
      </n-gi>

      <!-- 右侧：在线访客列表 -->
      <n-gi :span="2">
        <n-card :bordered="false" title="在线访客" class="dashboard-card">
          <template #header-extra>
            <span class="online-count">总人数: {{ totalOnlineVisitors }}</span>
            <n-button text type="primary" @click="fetchOnlineVisitors" style="margin-left: 12px;"> <!-- 关键修改: 移除 :loading="onlineVisitorsLoading" -->
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
              </n-icon>
              刷新
            </n-button>
          </template>
          <!-- 关键修改: 移除 n-spin 组件 -->
          <n-list hoverable clickable>
            <n-list-item v-for="visitor in onlineVisitors" :key="visitor.user_id">
              <template #prefix>
                <n-avatar :src="visitor.avatar" round>
                  <n-icon v-if="!visitor.avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </n-icon>
                </n-avatar>
              </template>
              <template #default>
                <div class="visitor-info">
                  <span class="visitor-name">{{ visitor.username }}</span>
                  <span class="in-time">入店: {{ formatTime(visitor.in_time) }}</span>
                </div>
              </template>
            </n-list-item>
            <n-empty v-if="onlineVisitors.length === 0 && !onlineVisitorsLoading" description="暂无在线访客"></n-empty>
          </n-list>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { NGrid, NGi, NCard, NCarousel, NCarouselItem, NList, NListItem, NAvatar, NIcon, NButton, NEmpty, NSpin, useMessage } from 'naive-ui';
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const carouselImages = ref([]);
const carouselLoading = ref(false);

const onlineVisitors = ref([]);
const totalOnlineVisitors = ref(0);
const onlineVisitorsLoading = ref(false); // 仍然保留此状态，可用于其他非视觉的逻辑判断

let onlineVisitorsPollingInterval = null;

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(Number(timestamp) * 1000); // 假设是秒级时间戳
  return date.toLocaleString();
};

// 获取轮播图图片
const fetchCarouselImages = async () => {
  carouselLoading.value = true;
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }
    // 关键修改: 传入 type 参数为 'dashboard'
    const response = await axios.get(`${API_BASE_URL}/api/admin/carousel-images?type=dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    carouselImages.value = response.data;
  } catch (error) {
    console.error('获取仪表盘轮播图图片失败:', error); // 关键修改: 更新错误信息
    const errorMessage = error.response?.data?.error || '获取仪表盘轮播图图片失败。';
    message.error(errorMessage);
    carouselImages.value = [];
  } finally {
    carouselLoading.value = false;
  }
};

// 获取在线访客列表
const fetchOnlineVisitors = async () => {
  onlineVisitorsLoading.value = true; // 仍然更新此状态
  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }
    const response = await axios.get(`${API_BASE_URL}/api/admin/online-visitors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    onlineVisitors.value = response.data.visitors;
    totalOnlineVisitors.value = response.data.total_online_visitors;
  } catch (error) {
    console.error('获取在线访客列表失败:', error);
    const errorMessage = error.response?.data?.error || '获取在线访客列表失败。';
    message.error(errorMessage);
    onlineVisitors.value = [];
    totalOnlineVisitors.value = 0;
  } finally {
    onlineVisitorsLoading.value = false; // 仍然更新此状态
  }
};

onMounted(() => {
  fetchCarouselImages();
  fetchOnlineVisitors();

  // 每 15 秒刷新一次在线访客列表
  onlineVisitorsPollingInterval = setInterval(fetchOnlineVisitors, 15000);
});

onUnmounted(() => {
  // 组件卸载时清除定时器
  if (onlineVisitorsPollingInterval) {
    clearInterval(onlineVisitorsPollingInterval);
  }
});
</script>

<style scoped>
.admin-dashboard-container {
  padding: 20px;
}

.dashboard-card {
  height: 100%; /* 确保卡片占据全部高度 */
}

.carousel-wrapper {
  height: 700px; /* 关键修改: 控制垂直轮播图的高度，使其更长 */
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vertical-carousel {
  height: 100%; /* 轮播组件本身占据容器全部高度 */
}

.carousel-img {
  width: 100%;
  height: 100%; /* 图片填充轮播项 */
  object-fit: cover; /* 裁剪以填充，保证无空白 */
  display: block;
}

.online-count {
  font-weight: bold;
  margin-right: 8px;
  color: #333;
}

.visitor-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.visitor-name {
  font-weight: bold;
}

.in-time {
  font-size: 12px;
  color: #666;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .carousel-wrapper {
    height: 400px; /* 关键修改: 移动端高度也相应调整 */
  }
}
</style>
