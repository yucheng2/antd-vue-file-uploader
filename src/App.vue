<template>
  <div>
    <!-- 显示页面标题，表明这是一个演示自定义文件上传下载预览功能的demo页面 -->
    <h1>自定义文件上传下载预览 Demo 页面</h1>
    <p>此页面展示了自定义文件上传下载预览功能。下面是使用 UploadVideo 组件，通过 v-model 双向绑定 videoFiles 变量，实现视频文件的上传和显示。</p>
    <UploadVideo v-model="videoFiles" />
  </div>
</template>

<script lang="ts" setup>
// 从 Vue 引入 ref 函数，用于创建响应式数据
import { ref } from 'vue';
// 引入自定义的 UploadVideo 组件，用于处理视频文件的上传操作
import UploadVideo from './UploadVideo.vue';

/**
 * videoFiles 是一个响应式数组，用于存储视频文件的 URL。
 * 初始值包含一个示例视频的 URL，方便在页面加载时展示一个视频。
 */
const videoFiles = ref<string[]>([
  // 示例视频文件的 URL，作为初始展示的视频
  "https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4"
]);
</script>

<style scoped>
/* 为页面标题添加样式，使其居中显示并设置文字颜色 */
h1 {
  text-align: center;
  color: #333;
}
p {
  text-align: center;
  color: #666;
}
</style>
