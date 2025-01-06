<!-- 文件上傳組件 -->
<template>
  <el-dialog v-model="modelVisible" title="大文件上傳" width="700" align-center>
    <div>
      <el-upload
        class="upload-group"
        ref="uploadRef"
        v-model:file-list="fileList"
        :style="props.style"
        :multiple="props.multiple"
        :headers="props.headers"
        :data="props.data"
        :name="props.name"
        :action="props.action"
        :auto-upload="props.autoUpload"
        :accept="props.accept"
        :limit="props.limit"
        :on-change="handleChange"
        :http-request="handleRequest"
        :on-remove="handleRemove"
      >
        <!-- 選擇文件 -->
        <template #trigger>
          <slot name="chooseButton">
            <el-button
              v-if="props.showUploadBtn"
              type="primary"
              icon="Folder"
              :disabled="fileList.length >= props.limit"
            >
              選擇文件
            </el-button>
          </slot>
        </template>
        <slot name="uploadButton">
          <div style="display: inline-flex" v-if="props.showUploadBtn">
            <el-button
              class="ml-3"
              type="success"
              icon="Upload"
              @click="submitUpload"
              :loading="uploading"
              :disabled="fileList.length === 0 || uploading"
            >
              上傳文件
            </el-button>
          </div>
        </slot>
        <template #tip v-if="props.showTip">
          <div class="el-upload__tip">
            {{ props.tip }}
          </div>
        </template>
        <template #file="{ file }">
          <!-- {{ file }} -->
          <el-row class="row-bg" justify="space-between">
            <el-col :span="18">
              <div>{{ file.name }}</div>
            </el-col>
            <div class="col-status">
              <div v-if="file.status == 'success'">
                <el-icon color="#23c343" :size="14">
                  <CircleCheck />
                </el-icon>
              </div>
              <div
                v-if="file.status == 'fail'"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              >
                <el-button
                  type="warning"
                  icon="Refresh"
                  plain
                  size="small"
                  style="margin-right: 4px"
                  @click="fileRefresh"
                >
                  重新上傳
                </el-button>
                <el-icon color="#f76560" :size="14">
                  <CircleClose />
                </el-icon>
              </div>
              <div v-if="file.status == 'ready'">
                <el-icon color="#a9aeb8" :size="14"><Close /></el-icon>
              </div>
            </div>
          </el-row>
          <div>
            <el-progress
              v-if="showUploadPercent"
              :percentage="hashPercent"
              :status="hashProgressStatus"
              :indeterminate="hasIndeterminate"
              :format="hashProgressFormat"
              :stroke-width="2"
            />
          </div>
        </template>
      </el-upload>
      <!-- <el-progress
        v-if="showUploadPercent"
        :style="{
          display: showUploadPercent ? 'inline-flex' : 'none',
          width: '100%',
        }"
        :percentage="hashPercent"
        :status="hashProgressStatus"
        :format="hashProgressFormat"
        :indeterminate="hasIndeterminate"
      /> -->
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="modelVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadClose()">確定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import {
  UploadRawFile,
  UploadUserFile,
  UploadFile,
  UploadFiles,
} from 'element-plus';
// import { TOKEN_KEY } from '@/enums/CacheEnum';
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import type {
  UploadProps,
  UploadInstance,
  UploadRequestOptions,
} from 'element-plus';
import TestFileAPI from '@/api/testFile';

interface UploadAjaxError {
  message: string;
  // 添加其他必要的屬性
}

const emit = defineEmits(['update:modelValue', 'update:visible']);
const props = defineProps({
  /**
   * 開關
   */
  visible: {
    type: Boolean,
    default: false,
  },
  /**
   * 文件集合
   */
  modelValue: {
    type: Array<UploadUserFile>,
    default: () => [],
  },
  /**
   * 多選文件
   */
  multiple: {
    type: Boolean,
    default: false,
  },
  /**
   * 上傳地址
   */
  action: {
    type: String,
    default: '', //FileAPI.uploadUrl
  },
  /**
   * 自動上傳文件
   */
  autoUpload: {
    type: Boolean,
    default: false,
  },
  /**
   * 文件上傳數量限制
   */
  limit: {
    type: Number,
    default: 1,
  },
  /**
   * 是否顯示刪除按鈕
   */
  showDelBtn: {
    type: Boolean,
    default: true,
  },
  /**
   * 是否顯示上傳按鈕
   */
  showUploadBtn: {
    type: Boolean,
    default: true,
  },
  /**
   * 單個文件上傳大小限制(單位byte)
   */
  uploadMaxSize: {
    type: Number,
    default: 2 * 1024 * 1024,
  },
  /**
   * 上傳文件類型
   */
  accept: {
    type: String,
    default: '*',
  },
  /**
   * 上傳按鈕文本
   */
  uploadBtnText: {
    type: String,
    default: '選擇文件',
  },
  /**
   * 是否展示提示資訊
   */
  showTip: {
    type: Boolean,
    default: false,
  },
  /**
   * 提示資訊內容
   */
  tip: {
    type: String,
    default: '',
  },
  /**
   * 請求頭
   */
  headers: {
    type: Object,
    default: () => {
      return {
        Authorization: localStorage.getItem(TOKEN_KEY),
      };
    },
  },
  /**
   * 請求攜帶的額外參數
   */
  data: {
    type: Object,
    default: () => {
      return {};
    },
  },
  /**
   * 上傳文件的參數名
   */
  name: {
    type: String,
    default: 'file',
  },
  /**
   * 樣式
   */
  style: {
    type: Object,
    default: () => {
      return {
        width: '100%',
      };
    },
  },
});

const fileList = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const modelVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  },
});

/**關閉燈箱 */
const uploadClose = () => {
  modelVisible.value = false;
};

const uploadRef = ref<UploadInstance>();
const uploading = ref(false);
const showUploadPercent = ref(false);
const hashPercent = ref<number>(0);
const hasIndeterminate = ref<boolean>(false);
const hashProgressStatus = ref<'success' | 'warning' | 'exception'>();
const hashProgressFormat = () => {
  return hashPercent.value === 100 ? '上傳中' : `${hashPercent.value}%`;
};

const setChunkSize: number = 5 * 1024 * 1024;
const fileHash = ref<string>(''); // 文件 Hash 值
// const fileList = ref<Array<any>>([])
const formDataList = ref<{ formData: FormData }[]>([]); // 明確定義類型為包含 formData 的數組
const doneFileList = ref<Array<any>>([]);

/**文件分片函數
 * @param file 上傳的檔案
 * @param chunkSize 切割大小
 */
const sliceFn = (file: File, chunkSize: number): Blob[] => {
  const result: Blob[] = [];
  // 從第0開始切割，一次切割 chunkSize 字節
  for (let i = 0; i < file.size; i = i + chunkSize) {
    result.push(file.slice(i, i + chunkSize));
  }
  return result;
};

/**輔助線程計算大文件hash值
 * 因为文件閱讀器是易步的，所以要套一層Promise拿到異步的計算结果
 * @param chunks 分塊數據
 * @param hash md5計算結果
 * @param hashProgress 計算進度條
 * @param error 錯誤訊息
 */
const calFileMd5ByThreadFn = (chunks: Blob[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 創建 Web Worker
    const worker = new Worker(new URL('./utils/worker.ts', import.meta.url), {
      type: 'module',
    });

    // 傳遞分塊數據到 Worker
    worker.postMessage({ chunks });

    // 處理 Worker 返回的消息
    worker.onmessage = (e: MessageEvent) => {
      const { hash, hashProgress, error } = e.data;
      // console.log('收到 Worker 訊息:', e.data)

      // 錯誤
      if (error) {
        console.log('Worker 錯誤:', error);
        worker.terminate(); // 結束 Worker
        reject(error);
        return;
      }

      // 將 MD5 計算hash結果返回
      if (hash) {
        worker.terminate();
        resolve(hash);
      }

      // 計算進度條
      if (hashProgress) {
        console.log(hashProgress, 'hashProgress');
        hasProgressFn(hashProgress);
        // onProgress(chunks) // hashProgress
      }
    };

    // 處理 Worker 錯誤
    worker.onerror = (err) => {
      console.log('Worker 錯誤 :', err);
      worker.terminate();
      reject(err); // 捕捉 Worker 的異常
    };
  });
};

/**上傳中 */
const onProgress = (file: any) => {
  file.percentage = 50;
  file.status = 'uploading';
};

/**上傳失敗 */
const onFail = (file: any) => {
  file.percentage = 0;
  file.status = 'fail';

  showUploadPercent.value = false;
  hashProgressStatus.value = 'exception';
  hasIndeterminate.value = false;
  uploading.value = false;
};

/**上傳成功 */
const onSuccess = (file: any) => {
  file.percentage = 100;
  file.status = 'success';
};

/**手動上傳文件 */
const submitUpload = () => {
  if (fileList.value.length === 0) {
    return ElMessage.warning('請選擇文件');
  }

  uploading.value = true;
  showUploadPercent.value = true;
  hashPercent.value = 0;

  fileList.value = fileList.value.map((file: any) => ({
    raw: file.raw,
    name: file.name,
    percentage: 0, // 進度條
    status: undefined, // 'ready' | 'uploading' | 'success' | 'fail'
  }));

  console.log(fileList.value, 'fileList.value');

  for (const file of fileList.value) {
    // file: file.raw,
    handleRequest({
      file: file,
    });
  }
};

/**自訂義上傳請求  options: UploadRequestOptions
 * onProgress, onSuccess, onError
 * type UploadStatus = 'ready' | 'uploading' | 'success' | 'fail'
 */
const handleRequest = async (options: any) => {
  const { file } = options;
  // 上傳分片文件
  await handleBeforeUpload(file);
};

/**第一步，上傳文件前分割文件
 * rawFile: UploadRawFile,
 */
const handleBeforeUpload = async (File: UploadFile) => {
  const file = File.raw; // 获取文件
  if (!file) {
    ElMessage.warning('文件未正確加載，請檢查文件列表');
    return false;
  }

  const chunks = sliceFn(file, setChunkSize); // 文件分块
  console.log('文件分片成數組', chunks);

  const fileMd5 = await calFileMd5ByThreadFn(chunks);
  fileHash.value = fileMd5; // 保存计算得到的 MD5

  // 調用上傳檢查邏輯
  // await uploadFileFormData(fileMd5, chunks, file.name)
  await uploadFileFormData(fileMd5, chunks, File);

  // 停止默認上傳行為
  return false;
};

/**第二步，拆分需上傳的formData */
const uploadFileFormData = async (
  fileMd5: string,
  chunks: Blob[],
  File: UploadFile
) => {
  ElMessage('文件上傳中，請耐心等候，謝謝');

  try {
    onProgress(File);
    const res: any = await TestFileAPI.checkFileFn(fileMd5, File.name);

    // 曾經上傳過一部分，現在要繼續上傳
    if (res.data.resultCode == false) {
      doneFileList.value = res.data.resultData.map((item: any) => {
        return item * 1; // 後端给到的是字符串索引，這里轉成數字索引
      });
    }
    // 沒有上傳過，組装一下，直接使用
    if (doneFileList.value.length == 0) {
      formDataList.value = chunks.map((item: Blob, index: number) => {
        let formData = new FormData();
        formData.append('file', item); // 使用FormData可以將blob文件轉成二進制binary
        formData.append('chunks', chunks.length.toString()); // 總片數
        formData.append('chunk', index.toString()); // 第幾片
        formData.append('fileName', File.name); // 檔案名
        formData.append('fileMd5', fileMd5); // 完整文件hash值
        return { formData };
      });
    } else {
      // 說明曾經上傳過，需要過濾一下，層經上傳的就不用再上傳了
      formDataList.value = chunks
        .filter((_, index: number) => {
          return !doneFileList.value.includes(index);
        })
        .map((item, index) => {
          let formData = new FormData();
          formData.append('file', item); // 使用FormData可以將blob文件转成二進制binary
          formData.append('chunks', chunks.length.toString());
          formData.append('chunk', index.toString());
          formData.append('fileName', File.name);
          formData.append('fileMd5', fileMd5);
          return { formData };
        });
    }
    fileUpload(formDataList.value, File, fileMd5);
  } catch (err: any) {
    ElMessage.error('文件上傳錯誤: ' + err.message);
    onFail(File);
  }
};

/**第三步，上傳文件（分片上傳，一片文件一個請求)
 * fileName
 */
const fileUpload = (
  formDataList: { formData: FormData }[],
  File: UploadFile,
  fileMd5: string
) => {
  const requestListFn = formDataList.map(({ formData }, index) => {
    return TestFileAPI.sliceFileUploadFn(formData); //formData
  });

  // 使用 allSettled 發請求好一些，掛了的就掛了，不影響後續不掛的請求
  Promise.allSettled(requestListFn).then(
    async (results: PromiseSettledResult<any>[]) => {
      const hasError = results.some((result) => result.status === 'rejected');

      // 使用 map 獲取所有錯誤信息
      const errorMessages = results
        .filter((result) => result.status === 'rejected')
        .map((result, index) => {
          return `文件第 ${index} 片上傳失敗: ${result.reason.message}`;
        });

      // 上傳片數失敗
      if (hasError) {
        onFail(File);
        hashProgressStatus.value = 'exception';
        hasIndeterminate.value = false;
        uploading.value = false;

        ElMessageBox.confirm(`${errorMessages.join('，')}`, '文件上傳錯誤', {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'error',
        })
          .then(() => {
            // resetfileList()
          })
          .catch(() => {
            // resetfileList()
          });
        return;
      }

      // 檢查文件是否合併完成
      setTimeout(() => {
        // checkFileStatus(fileMd5, fileName)
        checkFileStatus(fileMd5, File);
      }, 3000);
    }
  );
};

/**第四步，檢查文件後端是否合併成功
 * fileMd5: string, fileName: string
 */
const checkFileStatus = async (fileMd5: string, File: UploadFile) => {
  try {
    // const res: any = await TestFileAPI.checkFileFn(fileMd5, fileName)
    const res: any = await TestFileAPI.checkFileFn(fileMd5, File.name);
    if (res.data.resultCode) {
      // 上傳完畢，文件上傳進度條為100
      hashPercent.value = 100;
      hashProgressStatus.value = 'success';
      hasIndeterminate.value = false;
      uploading.value = false;
      ElMessage.success('文件上傳成功，合併完成。');
    } else {
      // 如果 resultCode 為 false，過3秒後再次檢查
      setTimeout(() => checkFileStatus(fileMd5, File), 3000);
    }
  } catch (err) {
    hashProgressStatus.value = 'exception';
    hasIndeterminate.value = false;
    uploading.value = false;
    ElMessage.error('檢查文件錯誤: ' + err);
  }
};

/**重新上傳 */
const fileRefresh = () => {
  // 確認是否上傳過
  console.log('重新上傳');
  // TestFileAPI.checkFileFn(fileMd5, File.name).then((res) => {})
};

/**文件選擇變化，添加文件、上傳成功和上傳失敗時都會被調用 */
const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles;
};

/**刪除文件清單 */
const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  hashPercent.value = 0;
  hashProgressStatus.value = undefined;
};

/**清除檔案 */
const resetfileList = () => {
  showUploadPercent.value = false;
  hashPercent.value = 0;
  hashProgressStatus.value = undefined;
  fileList.value = [];
  formDataList.value = [];
};

/**文件進度條
 * @param val 進度數
 */
const hasProgressFn = (val: number) => {
  hashPercent.value = val;
  if (val === 100) {
    hasIndeterminate.value = true;
  }
};

// 暴露方法
defineExpose({
  submitUpload,
});
</script>

<style lang="scss" scoped>
::deep(.el-upload-list__item) {
  padding: 4px 0px;
}
</style>
