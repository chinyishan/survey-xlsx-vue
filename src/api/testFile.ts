import request from '@/utils/request';
import axios from 'axios';

const TestFileAPI = {
  /**
   * 校驗文件是否上傳過，分三種情况，見 fileStatus
   * @param fileMd5 Md5 計算的 hash 值
   */
  checkFileFn(fileMd5: string, fileName: string) {
    return new Promise((resolve, reject) => {
      resolve(
        axios.get(`/bigfile/check?fileName=${fileName}&fileMd5=${fileMd5}`)
      );
    });
    // return request({
    //   url: `bigfile/check?fileMd5=${fileMd5}`,
    //   method: 'post',
    // })
  },

  /**
   * 分片上傳請求接口
   * @param formData 檔案資料
   */
  sliceFileUploadFn(formData: any) {
    return new Promise((resolve, reject) => {
      resolve(axios.post('/bigfile/upload', formData));
    });
    // return request({
    //   url: `bigfile/upload`,
    //   data: formData,
    //   method: 'post',
    // })
  },

  /**
   * 告知後端要去合并前端上傳的文件
   * @param fileName 檔案名稱
   * @param fileMd5 Md5 計算的 hash 值
   */
  tellBackendMergeFn(fileName: any, fileMd5: any) {
    return new Promise((resolve, reject) => {
      resolve(
        axios.post(
          `http://172.31.19.35/bigfile/merge?fileName=${fileName}&fileMd5=${fileMd5}`
        )
      );
    });
    // return request({
    //   url: `bigfile/merge?fileName=${fileName}&fileMd5=${fileMd5}`,
    //   method: 'post',
    // })
  },
};

export default TestFileAPI;
