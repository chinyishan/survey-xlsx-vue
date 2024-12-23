<template>
  <div class="app-container">
    <h1>spark-md5大文件上傳</h1>
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
    <div>
      <p>文件區塊數 : {{ chunksCount }} 片</p>
      <p>計算文件的 Hash 值 : {{ fileHash }}</p>
      <el-progress :percentage="hashProgress" />
    </div>
    <div>
      <p>上傳文件的進度</p>
      <p v-show="fileProgress == 100">文件上傳完成</p>
      <el-progress :percentage="fileProgress"></el-progress>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus';
import type { UploadRawFile, UploadFile } from 'element-plus';

import {
  checkFileFn,
  sliceFileUploadFn,
  tellBackendMergeFn,
} from '@/utils/request';

const fileStatus: Record<string, any> = {
  0: '文件不存在（沒有上傳過）',
  1: '文件已存在（曾經上傳過）',
  2: '文件不完整（曾經上傳中斷過，可繼續上傳）',
};

let doneFileList: any[] = []; // 曾經上傳過得文件
let formDataList = []; // 準備参數數組

const CHUNK_SIZE: number = 5 * 1024 * 1024;
const hashProgress = ref<number>(0);
const chunksCount = ref<number>(0);
const fileHash = ref<string>('');
const fileProgress = ref<number>(0);

/**
 * 文件分片函数
 * @param file 上傳的檔案
 * @param chunkSize 切割大小
 */
const sliceFn = (file: File, chunkSize: number): Blob[] => {
  const result: Blob[] = [];
  // 從第0字結开始切割，一次切割1 * 1024 * 1024字节
  for (let i = 0; i < file.size; i = i + chunkSize) {
    result.push(file.slice(i, i + chunkSize));
  }
  return result;
};

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
    const worker = new Worker(new URL('@/plugins/worker.ts', import.meta.url), {
      type: 'module',
    });

    // 傳遞分塊數據到 Worker
    worker.postMessage({ chunks });

    // 處理 Worker 返回的消息
    worker.onmessage = (e: MessageEvent) => {
      const { hash, hashProgress, error } = e.data;
      console.log('收到 Worker 訊息:', e.data);

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
  const file = rawFile; // 獲取文件
  const chunks = sliceFn(file, CHUNK_SIZE); // 文件分塊
  console.log('文件分片成數組', chunks);

  chunksCount.value = chunks.length; // 更新分片計數

  // 分片數組用於計算 MD5，更新進度條
  const fileMd5 = await calFileMd5ByThreadFn(chunks);
  fileHash.value = fileMd5; // 保存計算得到的 MD5

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
  formDataList = chunks.map((item: any, index: any) => {
    // 後端接参：文件片、文件分的片數、每次上傳是第幾片(索引)、文件名、此完整大文件hash值
    let formData = new FormData();
    formData.append('file', item); // 使用FormData可以将blob文件转成二进制binary
    formData.append('chunks', chunks.length.toString());
    formData.append('chunk', index.toString());
    formData.append('name', fileName);
    formData.append('md5', fileMd5);
    console.log(formData.get('file'), fileName);
    return { formData };
  });

  // // 根據文件的hash值進行上傳之前的校驗，校驗结果如下三種情况
  // const res: any = await checkFileFn(fileMd5);

  // // 1: 曾經上傳過，不需要再上傳了
  // if (res.data.resultCode == 1) {
  //   ElMessage({
  //     type: 'warning',
  //     message: fileStatus[res.data.resultCode],
  //   });
  //   return;
  // }

  // // 2: 曾經上傳過一部分，現在要繼續上傳
  // if (res.data.resultCode == 2) {
  //   // 若文件曾上傳過一部分，後端會返回上傳過的部分的文件索引，前端通過索引可以知道哪些上傳過，
  //   // 需做一個過濾，已上傳的文件就不用繼續上傳了，僅上傳未上傳過的文件片
  //   doneFileList = res.data.resultData.map((item: any) => {
  //     return item * 1; // 後端给到的是字符串索引，這裡轉成數字索引
  //   });
  //   console.log(fileStatus[res.data.resultCode]);
  // }

  // // 0: 沒有上傳過，直接上傳
  // if (res.data.resultCode == 0) {
  //   console.log(fileStatus[res.data.resultCode]);
  // }

  // 根據文件的hash值進行上傳之前的校驗，校驗结果如下三種情况
  await checkFileFn(fileMd5)
    .then((res) => {
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
        // 若文件曾上傳過一部分，後端會返回上傳過的部分的文件索引，前端通過索引可以知道哪些上傳過，
        // 需做一個過濾，已上傳的文件就不用繼續上傳了，僅上傳未上傳過的文件片
        doneFileList = res.data.resultData.map((item: any) => {
          return item * 1; // 后端给到的是字符串索引，这里转成数字索引
        });
        console.log(fileStatus[res.data.resultCode]);
      }

      // 0: 沒有上傳過，直接上傳
      if (res.data.resultCode == 0) {
        console.log(fileStatus[res.data.resultCode]);
      }
    })
    .catch((err) => {
      ElMessage.error('校驗文件失敗:' + err);
    });

  // 没有上傳過，組装一下，直接使用
  if (doneFileList.length == 0) {
    formDataList = chunks.map((item: any, index: any) => {
      // 後端接参數大致有：文件片、文件分的片數、每次上傳是第幾片(索引)、文件名、此完整大文件hash值
      let formData = new FormData();
      formData.append('file', item); // 使用FormData可以將blob文件转成二進制binary
      formData.append('chunks', chunks.length.toString());
      formData.append('chunk', index.toString());
      formData.append('name', fileName);
      formData.append('md5', fileMd5);
      return { formData };
    });
  } else {
    // 說明曾經上傳過，需要過濾一下，層經上傳的就不用再上傳了
    formDataList = chunks
      .filter((index: any) => {
        return !doneFileList.includes(index);
      })
      .map((item: any, index: any) => {
        let formData = new FormData();
        formData.append('file', item); // 使用FormData可以將blob文件转成二進制binary
        formData.append('chunks', chunks.length.toString());
        formData.append('chunk', index.toString());
        formData.append('name', fileName);
        formData.append('md5', fileMd5);
        return { formData };
      });
  }
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
    // 每上傳完畢一片文件，後端告知已上傳了多少片，除以總片數，就是進度
    fileProgress.value = Math.ceil(
      (res.data.resultData / chunksCount.value) * 100
    );
    return res;
  });
  // 使用 allSettled 發請求好一些，掛了的就掛了，不影想後續不掛的請求

  console.log('合併哪個文件: ', fileName, fileHash.value);

  Promise.allSettled(requestListFn)
    .then(async (res) => {
      // 都上傳完畢了，文件上傳進度條就為100%
      fileProgress.value = 100;

      // 最後再告知後端合併已經上傳的文件碎片
      // const loading = ElLoading.service({
      //   lock: true,
      //   text: '文件合併中，请稍後...',
      //   background: 'rgba(0, 0, 0, 0.7)',
      // });
      // const res: any = await tellBackendMergeFn(fileName, fileHash.value);
      // if (res.data.resultCode === 0) {
      //   console.log('文件合併成功，大文件上傳任務完成');
      //   loading.close();
      // } else {
      //   console.log('文件合併失敗，大文件上傳任務未完成');
      //   loading.close();
      // }
    })
    .catch((err) => {});
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
  hashProgress.value = val;
};
</script>
<style></style>
