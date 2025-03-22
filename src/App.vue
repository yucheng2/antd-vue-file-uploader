<template>
  <div>
    <UploadVideo v-model="videoFiles" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import UploadVideo from './UploadVideo.vue';
const videoFiles = ref<string[]>([
  "https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4"
]);
</script>

<style scoped>
/* 可以添加全局样式 */
</style>
