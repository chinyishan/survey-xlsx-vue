import axios from 'axios';

/**
 * 文件分片函数
 * @param file 上傳的檔案
 * @param chunkSize 切割大小
 */
export function sliceFn(file: File, chunkSize: number): Blob[] {
  const result: Blob[] = [];
  // 從第0字結开始切割，一次切割1 * 1024 * 1024字节
  for (let i = 0; i < file.size; i = i + chunkSize) {
    result.push(file.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * 校驗文件是否上傳過，分三種情况：見：fileStatus
 * @param fileMd5 Md5 計算的 hash 值
 */
export function checkFileFn(fileMd5: any) {
  return new Promise((resolve, reject) => {
    resolve(
      axios.post(`http://127.0.0.1:8686/bigfile/check?fileMd5=${fileMd5}`)
    );
  });
}

/**
 * 分片上傳請求接口
 * @param formData 檔案資料
 */
export function sliceFileUploadFn(formData: any) {
  return new Promise((resolve, reject) => {
    resolve(axios.post('http://127.0.0.1:8686/bigfile/upload', formData));
  });
}

/**
 * 告知後端要去合并前端上傳的文件
 * @param fileName 檔案名稱
 * @param fileMd5 Md5 計算的 hash 值
 */
export function tellBackendMergeFn(fileName: any, fileMd5: any) {
  return new Promise((resolve, reject) => {
    resolve(
      axios.post(
        `http://127.0.0.1:8686/bigfile/merge?fileName=${fileName}&fileMd5=${fileMd5}`
      )
    );
  });
}
