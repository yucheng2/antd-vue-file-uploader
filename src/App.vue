<template>
  <div class="clearfix">
    <!-- 修改处：添加 customRequest 属性 -->
    <Upload v-model:file-list="fileList" list-type="picture-card" @preview="handlePreview"
      :customRequest="customRequest">
      <div v-if="fileList.length < 8">
        <plus-outlined />
        <div style="margin-top: 8px">Upload</div>
      </div>
    </Upload>
    <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
      <div id="video-player"></div>
    </a-modal>
    <!-- 删除手动上传按钮 -->
    <!-- <a-button @click="uploadFiles">手动上传</a-button> -->
  </div>
</template>

<script lang="ts" setup>
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { Upload } from 'ant-design-vue';
import { nextTick, ref, watchEffect } from 'vue';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';

const previewFile = ref([
  'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
]);

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// 获取视频第一帧作为预览图
// 获取视频第一帧作为预览图
async function getVideoPreview(file: File) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      video.currentTime = 0;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        function drawFrame() {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const previewDataUrl = canvas.toDataURL('image/jpeg');
          resolve(previewDataUrl);
        }
        video.onseeked = () => {
          requestAnimationFrame(drawFrame);
        };
        video.currentTime = 0;
      } else {
        reject(new Error('无法获取 canvas 上下文'));
      }
    };

    video.onerror = () => {
      reject(new Error('无法加载视频'));
    };
  });
}

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
let player: Player | null = null;

const fileList = ref<UploadProps['fileList']>([]);
watchEffect(() => {
  console.log(fileList.value);

})

const handleCancel = () => {
  previewVisible.value = false;
  previewTitle.value = '';
  if (player) {
    player.destroy();
    player = null;
  }
};

const handlePreview = async (file: UploadProps['fileList'][number]) => {
  if (!file.url && !file.preview) {
    file.preview = (await getBase64(file.originFileObj)) as string;
  }
  const url = file.url || file.preview;
  if (typeof url === 'string') {
    previewImage.value = url;
    previewVisible.value = true;

    if (typeof file.url === 'string') {
      previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
    } else {
      previewTitle.value = file.name || 'Unknown';
    }

    await nextTick();

    if (player) {
      player.destroy();
    }
    const videoElement = document.getElementById('video-player');
    if (videoElement) {
      player = new Player({
        id: 'video-player',
        url: previewImage.value,
        download: true,
        width: '100%',
        autoplay: true,
        preload: 'auto', // 预加载视频
      });
    }
  } else {
    console.error('Invalid URL provided for preview:', url);
  }
};

// 自定义上传请求，直接上传文件
const customRequest = async ({ file, onSuccess, onError, file: { uid } }: { file: File; onSuccess: (response: any) => void; onError: (error: any) => void; file: { uid: string } }) => {
  try {
    // 创建 formData 对象
    const formData = new FormData();
    formData.append('file', file);
    // 替换为实际的后端接口地址
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
    });
    if (response.ok) {
      const data = await response.json();
      const url = data.url; // 假设服务器返回视频的 URL
      const previewDataUrl = await getVideoPreview(file);
      onSuccess({ status: 'success', url, previewDataUrl });
      // 更新 fileList 中对应文件的 url 和 preview 属性
      const targetFile = fileList.value.find(f => f.uid === uid);
      if (targetFile) {
        targetFile.url = url;
        targetFile.thumbUrl = previewDataUrl;
      }
    } else {
      throw new Error('上传失败');
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    onError(error);
  }
};

</script>

<style scoped>
/* you can make up upload button and sample style by using stylesheets */
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
