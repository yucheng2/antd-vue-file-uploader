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
import { nextTick, onUnmounted, ref, watchEffect, watch } from 'vue';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';

// 接收 v-model 的值
const props = defineProps<{
    modelValue: string[] | null;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', files: File[]): void;
}>();

// 获取视频第一帧作为预览图
async function getVideoPreview(file: File) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.src = url;
        video.preload = 'metadata';

        const onLoadedMetadata = () => {
            video.currentTime = 0;
            const canvas = document.createElement('canvas');
            // 避免小数计算
            canvas.width = Math.floor(video.videoWidth);
            canvas.height = Math.floor(video.videoHeight);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const drawFrame = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const previewDataUrl = canvas.toDataURL('image/jpeg');
                    // 释放临时 URL
                    URL.revokeObjectURL(url);
                    // 移除事件监听器
                    video.removeEventListener('seeked', onSeeked);
                    video.removeEventListener('loadedmetadata', onLoadedMetadata);
                    video.removeEventListener('error', onError);
                    resolve(previewDataUrl);
                };
                const onSeeked = () => {
                    requestAnimationFrame(drawFrame);
                };
                video.addEventListener('seeked', onSeeked);
                video.currentTime = 0;
            } else {
                // 释放临时 URL
                URL.revokeObjectURL(url);
                // 移除事件监听器
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('error', onError);
                reject(new Error('无法获取 canvas 上下文'));
            }
        };

        const onError = () => {
            // 释放临时 URL
            URL.revokeObjectURL(url);
            // 移除事件监听器
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('无法加载视频'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
    });
}

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
let player: Player | null = null;

const fileList = ref<UploadProps['fileList']>([]);
watchEffect(() => {
    console.log(fileList.value);
});

const handleCancel = () => {
    previewVisible.value = false;
    previewTitle.value = '';
    if (player) {
        player.destroy();
        player = null;
    }
};

// 用于存储文件和其对应的 URL
const fileUrlMap = new Map<File, string>();

/**
 * 通过file生成临时url，如果文件已存在对应的URL则直接返回
 * @param file 
 */
const getFileUrl = (file: File) => {
    if (fileUrlMap.has(file)) {
        return fileUrlMap.get(file)!;
    }
    const url = URL.createObjectURL(file);
    fileUrlMap.set(file, url);
    return url;
};

const handlePreview = async (file: UploadProps['fileList'][number]) => {
    if (!file.url && !file.preview) {
        const tempUrl = URL.createObjectURL(file.originFileObj as File);
        previewImage.value = tempUrl;
        file.preview = tempUrl;
    } else {
        previewImage.value = file.url || file.preview;
    }
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
};

// 自定义上传请求，直接上传文件
const customRequest = async ({ file, onSuccess, onError, file: { uid } }: { file: File; onSuccess: (response: any) => void; onError: (error: any) => void; file: { uid: string } }) => {
    try {
        const url = getFileUrl(file);
        const previewDataUrl = await getVideoPreview(file);
        onSuccess({ status: 'success', url, previewDataUrl });
        // 更新 fileList 中对应文件的 url 和 preview 属性
        const targetFile = fileList.value.find(f => f.uid === uid);
        if (targetFile) {
            targetFile.url = url;
            targetFile.thumbUrl = previewDataUrl;
        }
        // 触发 update:modelValue 事件
        const files = fileList.value.map(f => f.originFileObj as File);
        emit('update:modelValue', files);
    } catch (error) {
        console.error('文件上传失败:', error);
        onError(error);
    }
};

async function getVideoPreviewFromUrl(url: string) {
    return new Promise<string>((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = url;
        video.preload = 'metadata';

        const abortController = new AbortController();
        const signal = abortController.signal;

        // 设置超时时间
        const timeoutId = setTimeout(() => {
            abortController.abort();
            reject(new Error('Video loading timed out'));
        }, 10000); // 10 秒超时

        // 当视频元数据加载完成时触发
        const onLoadedMetadata = () => {
            clearTimeout(timeoutId);
            video.currentTime = 0;
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(video.videoWidth);
            canvas.height = Math.floor(video.videoHeight);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const drawFrame = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    try {
                        const previewDataUrl = canvas.toDataURL('image/jpeg');
                        // 移除事件监听器
                        removeEventListeners();
                        resolve(previewDataUrl);
                    } catch (error) {
                        // 移除事件监听器
                        removeEventListeners();
                        reject(new Error('Failed to export canvas data: ' + error.message));
                    }
                };
                const onSeeked = () => {
                    requestAnimationFrame(drawFrame);
                };
                video.addEventListener('seeked', onSeeked);
                video.currentTime = 0;
            } else {
                // 移除事件监听器
                removeEventListeners();
                reject(new Error('Unable to get canvas context'));
            }
        };

        const onError = () => {
            clearTimeout(timeoutId);
            // 移除事件监听器
            removeEventListeners();
            reject(new Error('Failed to load video'));
        };

        const removeEventListeners = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            video.removeEventListener('abort', onAbort);
        };

        const onAbort = () => {
            clearTimeout(timeoutId);
            // 移除事件监听器
            removeEventListeners();
            reject(new Error('Video loading aborted'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata, { signal });
        video.addEventListener('error', onError, { signal });
        video.addEventListener('abort', onAbort, { signal });
    });
}

// 监听 modelValue 的变化
watch(() => props.modelValue, async (newValue) => {
    if (newValue) {
        // 加载 URL 类型的文件
        fileList.value = await Promise.all(newValue.map(async (url) => {
            const thumbUrl = await getVideoPreviewFromUrl(url)
            return {
                uid: String(Date.now()),
                name: url.substring(url.lastIndexOf('/') + 1),
                status: 'done',
                url: url,
                thumbUrl: thumbUrl, // 假设缩略图 URL 与文件 URL 相同
                originFileObj: null // 由于是 URL 类型的文件，没有本地文件对象
            }
        }));
    }
}, { immediate: true });

// 在组件销毁时释放所有 URL
onUnmounted(() => {
    fileUrlMap.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    fileUrlMap.clear();
});
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