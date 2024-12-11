import SparkMD5 from 'spark-md5';

/**
 * 使用 SparkMD5 創建 Web Worker
 * @param e 接收到的訊息
 * @param chunks 分塊數據
 */
self.onmessage = (e: MessageEvent) => {
  console.log(e.data, 'e.data');
  const { chunks } = e.data; // 獲取文件分片數組
  const spark = new SparkMD5.ArrayBuffer(); // 實例化spark對象用於計算文件hash
  const fileReader = new FileReader(); // 實例化文件閱讀器來讀取blob二進制文件
  let currentChunk = 0; // 從第0塊開始讀

  // 讀取成功，分塊處理
  fileReader.onload = (event: ProgressEvent<FileReader>) => {
    if (event.target?.result) {
      spark.append(event.target.result as ArrayBuffer); // 添加當前分塊到 SparkMD5
      currentChunk += 1;

      if (currentChunk < chunks.length) {
        // 還有分塊未處理，繼續讀取下一塊
        fileReader.readAsArrayBuffer(chunks[currentChunk]);
        self.postMessage({
          hashProgress: Math.ceil((currentChunk / chunks.length) * 100), // 返回進度
        });
      } else {
        // 所有分塊處理完成，返回最终結果
        self.postMessage({
          hash: spark.end(), // 計算最終 MD5
          hashProgress: 100,
        });
        self.close(); // 關閉 Worker
      }
    }
  };

  // 讀取錯誤
  fileReader.onerror = () => {
    self.postMessage({
      error: '文件讀取錯誤',
    });
    self.close(); // 關閉 Worker
  };

  // 開始讀取第一塊
  fileReader.readAsArrayBuffer(chunks[currentChunk]);
};
