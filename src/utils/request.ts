import axios from 'axios';

/**
 * 校驗文件是否上傳過，分三種情况：見：fileStatus
 * @param fileMd5 Md5 計算的 hash 值
 */
export function checkFileFn(fileMd5: any) {
  return axios.post(`http://127.0.0.1:8686/bigfile/check?fileMd5=${fileMd5}`);
  // return new Promise((resolve, reject) => {
  //   resolve(
  //   );
  // });
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
