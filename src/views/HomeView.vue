<template>
  <n-config-provider>
    <n-message-provider>
      <div class="scroll-container">
        <n-layout>
          <n-layout-header bordered>
            <div class="header-content">
              <n-h1>访客系统</n-h1>
            </div>
          </n-layout-header>

          <n-layout-content content-style="padding: 24px;">
            <router-view />
          </n-layout-content>
          
          <n-layout-footer bordered position="absolute">
            <n-grid x-gap="12" :cols="2">
              <n-gi>
                <n-button 
                  block
                  class="footer-button"
                  @click="goTo('/check-in')"
                >
                  <template #icon>
                    <n-icon>
                      <n-svg-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                      </n-svg-icon>
                    </n-icon>
                  </template>
                  访客进店
                </n-button>
              </n-gi>
              <n-gi>
                <n-button 
                  block
                  class="footer-button"
                  @click="goTo('/user-center')"
                >
                  <template #icon>
                    <n-icon>
                      <n-svg-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </n-svg-icon>
                    </n-icon>
                  </template>
                  个人中心
                </n-button>
              </n-gi>
            </n-grid>
          </n-layout-footer>
        </n-layout>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { useRouter } from 'vue-router';

// 删除了未使用的导入：useMessage, axios
import { 
  NLayout, 
  NLayoutHeader, 
  NLayoutContent, 
  NLayoutFooter, 
  NH1, 
  NGrid, 
  NGi, 
  NButton, 
  NIcon,
  NSvgIcon,
  NConfigProvider, 
  NMessageProvider
} from 'naive-ui';

const router = useRouter();

// 删除了未使用的变量：API_BASE_URL, message, handleUnauthorized

// 定义一个异步函数来检查登录状态
// 现在只检查本地是否存在 token，不再向后端发送请求
const checkLoginStatus = async () => {
  const token = localStorage.getItem('user-token');
  // 如果本地没有 token，则直接返回 false
  if (!token) {
    return false;
  }
  
  // 简单地返回 true，表示本地令牌存在
  return true;
};

// 修改 goTo 函数，它会先执行验证，然后无条件跳转
const goTo = async (path) => {
  await checkLoginStatus(); // 等待本地检查逻辑执行完毕
  router.push(path); // 无条件执行路由跳转
};
</script>

<style scoped>
/* 标题栏容器样式 */
.header-content {
  width: 100%;
  text-align: center;
  padding: 0 24px;
}

/* 布局头部样式 */
.n-layout-header {
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

/* 调整内容区域，以避免被固定头部遮挡 */
.n-layout-content {
  margin-top: 64px;
  margin-bottom: 64px;
  min-height: calc(100vh - 128px);
}

/* 标题样式 */
.header-content h1.n-h1 {
  font-size: 1.5em; 
  margin-bottom: 0; 
  font-weight: bold; 
}

/* 底部菜单栏样式 */
.n-layout-footer {
  bottom: 0;
  width: 100%;
  padding: 12px 24px;
  position: fixed;
  left: 0;
  z-index: 1000;
}

.footer-button {
  width: 100%;
  justify-content: center;
}

/* 隐藏全局滚动条，但保留滚动功能 */
html, body {
  overflow: hidden;
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 创建一个可滚动的容器 */
.scroll-container {
  height: 100vh;
  overflow-y: auto;
  /* 隐藏滚动条，但保留滚动功能 */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* 隐藏 WebKit 浏览器（Chrome, Safari等）上的滚动条 */
.scroll-container::-webkit-scrollbar {
  display: none;
}
</style>