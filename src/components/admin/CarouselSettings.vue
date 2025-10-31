<template>
  <div class="carousel-management-container">
    <n-card :bordered="false" title="轮播图管理">
      <n-tabs type="line" animated v-model:value="activeTab">
        <n-tab-pane name="home" tab="首页轮播图">
          <n-divider style="margin: 10px 0;"></n-divider>
          <div class="tab-content">
            <n-space justify="end" style="margin-bottom: 16px;">
              <n-button type="primary" @click="showAddHomeModal = true">
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </n-icon>
                添加首页轮播图
              </n-button>
            </n-space>
            <n-data-table
              :columns="carouselColumns('home')"
              :data="homeCarouselImages"
              :loading="loadingHome"
              :bordered="false"
              :empty-description="'当前没有首页轮播图。'"
            />
          </div>
        </n-tab-pane>
        <n-tab-pane name="dashboard" tab="仪表盘轮播图">
          <n-divider style="margin: 10px 0;"></n-divider>
          <div class="tab-content">
            <n-space justify="end" style="margin-bottom: 16px;">
              <n-button type="primary" @click="showAddDashboardModal = true">
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </n-icon>
                添加仪表盘轮播图
              </n-button>
            </n-space>
            <n-data-table
              :columns="carouselColumns('dashboard')"
              :data="dashboardCarouselImages"
              :loading="loadingDashboard"
              :bordered="false"
              :empty-description="'当前没有仪表盘轮播图。'"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 添加首页轮播图模态框 -->
    <n-modal
      v-model:show="showAddHomeModal"
      preset="dialog"
      title="添加首页轮播图"
      positive-text="添加"
      negative-text="取消"
      @positive-click="handleAddCarouselImage('home')"
      @negative-click="showAddHomeModal = false"
    >
      <n-form :model="newHomeCarouselImage" label-placement="left" label-width="80px">
        <n-form-item label="图片URL">
          <n-input v-model:value="newHomeCarouselImage.image_url" placeholder="请输入图片URL" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="newHomeCarouselImage.order" :min="0" style="width: 100%;" />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 添加仪表盘轮播图模态框 -->
    <n-modal
      v-model:show="showAddDashboardModal"
      preset="dialog"
      title="添加仪表盘轮播图"
      positive-text="添加"
      negative-text="取消"
      @positive-click="handleAddCarouselImage('dashboard')"
      @negative-click="showAddDashboardModal = false"
    >
      <n-form :model="newDashboardCarouselImage" label-placement="left" label-width="80px">
        <n-form-item label="图片URL">
          <n-input v-model:value="newDashboardCarouselImage.image_url" placeholder="请输入图片URL" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="newDashboardCarouselImage.order" :min="0" style="width: 100%;" />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 删除确认模态框 -->
    <n-modal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      type="warning"
      title="确认删除"
      content="确定要删除此轮播图吗？此操作不可逆。"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirmDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { h, ref, onMounted, watch } from 'vue';
import { 
  NCard, NTabs, NTabPane, NSpace, NButton, NIcon, NDataTable, NImage, NDivider,
  NModal, NForm, NFormItem, NInput, NInputNumber, useMessage 
} from 'naive-ui';
import { useRoute } from 'vue-router'; // 导入 useRoute
import axios from 'axios';
import { useUserStore } from '@/stores/user.js';

const message = useMessage();
const userStore = useUserStore();
const route = useRoute(); // 获取当前路由实例
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const activeTab = ref('home'); // 默认激活首页轮播图
watch(() => route.path, (newPath) => {
  if (newPath.includes('home')) {
    activeTab.value = 'home';
  } else if (newPath.includes('dashboard')) {
    activeTab.value = 'dashboard';
  }
}, { immediate: true });


const homeCarouselImages = ref([]);
const dashboardCarouselImages = ref([]);
const loadingHome = ref(false);
const loadingDashboard = ref(false);

// 添加模态框和表单数据
const showAddHomeModal = ref(false);
const newHomeCarouselImage = ref({
  image_url: '',
  order: 0
});

const showAddDashboardModal = ref(false);
const newDashboardCarouselImage = ref({
  image_url: '',
  order: 0
});

// 删除确认模态框
const showDeleteConfirm = ref(false);
const deletingImageInfo = ref({ id: null, type: null }); // 存储要删除的图片ID和类型

// 获取轮播图数据
const fetchCarouselImages = async (type) => {
  if (type === 'home') loadingHome.value = true;
  if (type === 'dashboard') loadingDashboard.value = true;

  try {
    const token = userStore.token;
    if (!token) {
      message.error('未登录或登录信息已过期，请重新登录。');
      userStore.logout();
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/api/admin/carousel/${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (type === 'home') {
      homeCarouselImages.value = response.data;
    } else {
      dashboardCarouselImages.value = response.data;
    }
  } catch (error) {
    console.error(`获取${type}轮播图失败:`, error);
    const errorMessage = error.response?.data?.error || `获取${type}轮播图失败。`;
    message.error(errorMessage);
    if (type === 'home') homeCarouselImages.value = [];
    if (type === 'dashboard') dashboardCarouselImages.value = [];
  } finally {
    if (type === 'home') loadingHome.value = false;
    if (type === 'dashboard') loadingDashboard.value = false;
  }
};

// 表格列配置
const carouselColumns = (type) => [
  {
    title: 'ID',
    key: 'id',
    width: 60,
    sorter: (row1, row2) => row1.id - row2.id
  },
  {
    title: '图片预览',
    key: 'image_url',
    width: 150,
    render(row) {
      return h(NImage, {
        src: row.image_url,
        width: 100,
        height: 50,
        objectFit: 'cover',
        lazy: true,
        fallbackSrc: "https://placehold.co/100x50/cccccc/000000?text=无法加载" // 图片加载失败时的占位图
      });
    }
  },
  {
    title: '图片URL',
    key: 'image_url',
    minWidth: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '排序',
    key: 'order',
    width: 80,
    sorter: (row1, row2) => row1.order - row2.order
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    render(row) {
      return new Date(row.created_at * 1000).toLocaleString();
    },
    sorter: (row1, row2) => row1.created_at - row2.created_at
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'error',
            onClick: () => handleDeleteClick(row.id, type)
          }, { default: () => '删除' })
        ]
      });
    }
  }
];

// 添加轮播图
const handleAddCarouselImage = async (type) => {
  let newImage = type === 'home' ? newHomeCarouselImage.value : newDashboardCarouselImage.value;
  if (!newImage.image_url || newImage.image_url.trim() === '') {
    message.error('图片URL不能为空。');
    return;
  }
  if (newImage.order === null || newImage.order === undefined || isNaN(newImage.order)) {
    message.error('排序值必须是有效数字。');
    return;
  }

  try {
    const token = userStore.token;
    await axios.post(`${API_BASE_URL}/api/admin/carousel/${type}`, {
      image_url: newImage.image_url,
      order: newImage.order
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success(`添加${type === 'home' ? '首页' : '仪表盘'}轮播图成功！`);
    
    // 重置表单并关闭模态框
    if (type === 'home') {
      newHomeCarouselImage.value = { image_url: '', order: 0 };
      showAddHomeModal.value = false;
    } else {
      newDashboardCarouselImage.value = { image_url: '', order: 0 };
      showAddDashboardModal.value = false;
    }

    await fetchCarouselImages(type); // 刷新列表
  } catch (error) {
    console.error(`添加${type}轮播图失败:`, error);
    const errorMessage = error.response?.data?.error || `添加${type}轮播图失败。`;
    message.error(errorMessage);
  }
};

// 处理删除点击
const handleDeleteClick = (id, type) => {
  deletingImageInfo.value = { id, type };
  showDeleteConfirm.value = true;
};

// 确认删除轮播图
const handleConfirmDelete = async () => {
  const { id, type } = deletingImageInfo.value;
  if (!id || !type) return;

  try {
    const token = userStore.token;
    await axios.delete(`${API_BASE_URL}/api/admin/carousel/${type}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    message.success('轮播图删除成功！');
    showDeleteConfirm.value = false;
    await fetchCarouselImages(type); // 刷新列表
  } catch (error) {
    console.error('删除轮播图失败:', error);
    const errorMessage = error.response?.data?.error || '删除轮播图失败。';
    message.error(errorMessage);
  }
};

onMounted(() => {
  fetchCarouselImages('home');
  fetchCarouselImages('dashboard');
});
</script>

<style scoped>
.carousel-management-container {
  padding: 20px;
}
.n-card {
  margin-bottom: 20px;
}
.tab-content {
  padding: 10px 0;
}
</style>
