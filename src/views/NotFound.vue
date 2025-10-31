<template>
  <div class="not-found-container">
    <n-result status="404" title="404 资源不存在" description="抱歉，您访问的页面不存在。">
      <!-- 关键修改：移除自定义图标的 template #icon 块 -->
      <!-- n-result 组件在 status="404" 时会自动显示默认的 404 图标 -->
      <template #footer>
        <n-button type="primary" size="large" @click="goHome">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { NResult, NButton } from 'naive-ui'; // 移除 NIcon 的导入，因为不再需要自定义图标

const router = useRouter();

// 返回首页的函数
const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;   /* 垂直居中 */
  min-height: 100vh;      /* 占据整个视口高度 */
  background-color: #f5f5f5; /* 页面背景色 */
}

/* n-result 组件本身会根据其容器居中，
   如果需要对 n-result 内部的元素进一步调整，
   可以在这里添加 .n-result-content 等样式，但通常默认已居中。 */
</style>
