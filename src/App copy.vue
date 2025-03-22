<template>
  <div class="clearfix">
    <Upload v-model:file-list="fileList" :preview-file="getPreviewFile" list-type="picture-card" @preview="handlePreview"
      :before-upload="beforeUpload" :custom-request="customRequest">
      <div v-if="fileList.length < 8">
        <plus-outlined />
        <div style="margin-top: 8px">Upload</div>
      </div>
    </Upload>
    <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
      <div id="video-player"></div>
    </a-modal>
    <a-button @click="uploadFiles">手动上传</a-button>
  </div>
</template>

<script lang="ts" setup>
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { Upload } from 'ant-design-vue';
import { nextTick, ref } from 'vue';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';

const previewFile = ref([
  'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
]);

// Define a function to get the preview file as a Promise
const getPreviewFile = () => {
  return Promise.resolve(previewFile.value);
};

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
let player: Player | null = null;

const fileList = ref<UploadProps['fileList']>([]);

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
  // Ensure previewImage is a string
  const url = file.url || file.preview;
  if (typeof url === 'string') {
    previewImage.value = url;
    previewVisible.value = true;

    // Set previewTitle
    if (typeof file.url === 'string') {
      previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
    } else {
      previewTitle.value = file.name || 'Unknown';
    }

    // Wait for the next frame to ensure the DOM has been updated
    await nextTick();

    if (player) {
      player.destroy();
    }
    player = new Player({
      id: 'video-player',
      url: previewImage.value,
      download: true,
      width: '100%',
      autoplay: true,
    });
  } else {
    console.error('Invalid URL provided for preview:', url);
  }
};

// 阻止自动上传
const beforeUpload = () => false;

// 自定义上传请求
const customRequest = ({ file, onSuccess }: { file: File; onSuccess: (response: any) => void }) => {
  // 这里可以实现实际的文件上传逻辑，例如使用 fetch 或 axios
  console.log('上传文件:', file);
  // 模拟上传成功
  onSuccess({ status: 'success' });
};

// 手动上传文件
const uploadFiles = () => {
  fileList.value.forEach((file) => {
    if (file.originFileObj) {
      customRequest({
        file: file.originFileObj,
        onSuccess: (response) => {
          console.log('文件上传成功:', response);
          // 更新文件状态
          file.status = 'done';
          // 这里可以根据实际情况更新文件的 url
          file.url = 'https://example.com/uploaded-file.mp4';
        },
      });
    }
  });
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
