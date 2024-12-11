<template>
  <div>
    <h3>Spark-Md5</h3>
    <el-upload
      class="upload-demo"
      drag
      action="#"
      :before-upload="changeFile"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
    >
      <!-- 
        :limit="1"
        accept=".xlsx, .xls, .csv, .jpg, .png, .pdf" 
      -->
      <el-icon style="font-size: 32px; color: #c1cdd1">
        <UploadFilled />
      </el-icon>
      <div class="el-upload__text">
        將檔案拖到此處或
        <em>點擊上傳</em>
      </div>
    </el-upload>
    <el-progress :percentage="progress" />
    <p>文件區塊數 : {{ chunksCount }} 片</p>
    <p>計算文件的 Hash 值 : {{ fileHash }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus';
import type { UploadRawFile, UploadFile } from 'element-plus';

import {
  sliceFn,
  checkFileFn,
  sliceFileUploadFn,
  tellBackendMergeFn,
} from '@/utils/request';

const fileStatus: Record<string, any> = {
  0: '文件不存在（没有上传过）',
  1: '文件已存在（曾经上传过）',
  2: '文件不完整（曾经上传中断过，可继续上传）',
};

const inputRef = ref(); // 输入框dom

let doneFileList: any[] = []; // 曾经上传过得文件
let formDataList = []; // 准备参数数组

const CHUNK_SIZE: number = 5 * 1024 * 1024;
const progress = ref<number>(0);
const chunksCount = ref<number>(0);
const fileHash = ref<string>('');
const fileProgress = ref<number>(0);

/**
 * 輔助線程計算大文件hash值
 * 因为文件閱讀器是易步的，所以要套一層Promise拿到異步的計算结果
 * @param chunks 分塊數據
 * @param hash md5計算結果
 * @param hashProgress 計算進度條
 * @param error 錯誤訊息
 */
const calFileMd5ByThreadFn = (chunks: Blob[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 創建 Web Worker
    const worker = new Worker(new URL('@/worker.ts', import.meta.url), {
      type: 'module',
    });

    // 傳遞分塊數據到 Worker
    worker.postMessage({ chunks });

    // 處理 Worker 返回的消息
    worker.onmessage = (e: MessageEvent) => {
      const { hash, hashProgress, error } = e.data;

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
      if (hashProgress && progressFn) {
        progressFn(hashProgress);
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

//-------------------------------------------------------------------------

/**
 * 第一步，上傳文件
 * */
const changeFile = async (rawFile: UploadRawFile) => {
  const file = rawFile; // 获取文件
  const chunks = sliceFn(file, CHUNK_SIZE); // 文件分块
  console.log(file, 'file');
  console.log('文件分片成數組', chunks);

  chunksCount.value = chunks.length; // 更新分片计数

  // 分片數組用於計算 MD5，更新進度條
  const fileMd5 = await calFileMd5ByThreadFn(chunks);
  fileHash.value = fileMd5; // 保存计算得到的 MD5

  // 調用上傳檢查邏輯
  await uploadFileCheck(fileMd5, chunks, file.name);

  // 停止默認上傳行為
  return false;
};

/**
 * 第二步，上傳文件前的檢查
 * */
const uploadFileCheck = async (
  fileMd5: string,
  chunks: Blob[],
  fileName: string
) => {
  // 根據文件的hash值進行上傳之前的校驗，校驗结果如下三種情况
  const res: any = await checkFileFn(fileMd5);

  // 1: 曾經上傳過，不需要再上傳了
  if (res.data.resultCode == 1) {
    ElMessage({
      type: 'warning',
      message: fileStatus[res.data.resultCode],
    });
    return;
  }

  // 2: 曾經上傳過一部分，現在要繼續上傳
  if (res.data.resultCode == 2) {
    // 若是文件曾上传过一部分，后端会返回上传过得部分的文件索引，前端通过索引可以知道哪些
    // 上传过，做一个过滤，已上传的文件就不用继续上传了，上传未上传过的文件片
    doneFileList = res.data.resultData.map((item: any) => {
      return item * 1; // 后端给到的是字符串索引，这里转成数字索引
    });
    console.log(fileStatus[res.data.resultCode]);
  }

  // 0: 沒有上傳過，直接上傳
  if (res.data.resultCode == 0) {
    console.log(fileStatus[res.data.resultCode]);
  }

  // 说明没有上传过，组装一下，直接使用
  if (doneFileList.length == 0) {
    formDataList = chunks.map((item: any, index: any) => {
      // 后端接参大致有：文件片、文件分的片数、每次上传是第几片(索引)、文件名、此完整大文件hash值
      // 具体后端定义的参数prop属性名，看他们如何定义的，这个无妨...
      let formData = new FormData();
      formData.append('file', item); // 使用FormData可以将blob文件转成二进制binary
      formData.append('chunks', chunks.length.toString());
      formData.append('chunk', index.toString());
      formData.append('name', fileName);
      formData.append('md5', fileMd5);
      return { formData };
    });
  } else {
    // 说明曾经上传过，需要过滤一下，曾经上传过的就不用再上传了
    formDataList = chunks
      .filter((index: any) => {
        return !doneFileList.includes(index);
      })
      .map((item: any, index: any) => {
        let formData = new FormData();
        formData.append('file', item); // 使用FormData可以将blob文件转成二进制binary
        formData.append('chunks', chunks.length.toString());
        formData.append('chunk', index.toString());
        formData.append('name', fileName);
        formData.append('md5', fileMd5);
        return { formData };
      });
  }
  console.log(formDataList, fileName);
  fileUpload(formDataList, fileName);
};

/**
 * 第三步，上傳文件（分片上傳，一片文件就是一个請求）
 * */
const fileUpload = (
  formDataList: { formData: FormData }[],
  fileName: string
) => {
  const requestListFn = formDataList.map(async ({ formData }, index) => {
    const res: any = await sliceFileUploadFn(formData);
    // 每上传完毕一片文件，后端告知已上传了多少片，除以总片数，就是进度
    fileProgress.value = Math.ceil(
      (res.data.resultData / chunksCount.value) * 100
    );
    return res;
  });
  // 使用allSettled发请求好一些，挂了的就挂了，不影响后续不挂的请求
  Promise.allSettled(requestListFn).then(async (many) => {
    // 都上传完毕了，文件上传进度条就为100%了
    fileProgress.value = 100;
    // 最后再告知后端合并一下已经上传的文件碎片了即可
    const loading = ElLoading.service({
      lock: true,
      text: '文件合并中，请稍后...',
      background: 'rgba(0, 0, 0, 0.7)',
    });
    const res: any = await tellBackendMergeFn(fileName, fileHash.value);
    if (res.data.resultCode === 0) {
      console.log('文件并合成功,大文件上传任务完成');
      loading.close();
    } else {
      console.log('文件并合失败,大文件上传任务未完成');
      loading.close();
    }
  });
};

/**
 * 文件上傳成功
 */
const handleUploadSuccess = (response: any, uploadFile: UploadFile) => {
  console.log(response, 'handleUploadSuccess');
  console.log(uploadFile, 'handleUploadSuccess');
};

/**
 * 文件上傳失敗
 */
const handleUploadError = (error: Error) => {
  console.log('上傳失敗', error);
  ElMessageBox.confirm(`${error}`, '上傳失敗', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'error',
  })
    .then(() => {})
    .catch(() => {});
};

/**
 * 文件進度條
 * @param val 進度數
 */
const progressFn = (val: number) => {
  progress.value = val;
};
</script>
<style></style>
