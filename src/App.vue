<template>
  <n-config-provider>
    <n-message-provider>
      <div class="scroll-container">
        <router-view />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NMessageProvider } from 'naive-ui';
</script>

<style>
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
