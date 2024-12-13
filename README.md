# survey-xlsx-vue

## 專案簡介

本專案是一個基於 **Vite**、**TypeScript** 和 **Vue 3** 構建的 Web 應用，專注於實現以下功能：

- **XLSX 文件匯入與匯出**：支持靈活的數據導入和導出。
- **Ag-Grid 表格編輯**：提供高效的表格數據處理和編輯功能。
- **大文件上傳**：通過 `spark-md5` 和 Web Worker 實現大文件的分片上傳與 MD5 驗證。

## 技術棧

- **開發工具**：

  - [Vite](https://vitejs.dev/)：快速、現代化的前端構建工具。
  - [TypeScript](https://www.typescriptlang.org/)：靜態類型檢查，增強代碼可維護性。
  - [Vue 3](https://vuejs.org/)：構建用戶界面的漸進式框架。

- **主要依賴**：
  - [xlsx](https://github.com/SheetJS/sheetjs)：處理 Excel 文件的讀取和導出。
  - [ag-Grid](https://www.ag-grid.com/)：功能強大的數據表格。
  - [spark-md5](https://github.com/satazor/js-spark-md5)：高效的 MD5 算法庫。
  - **Web Worker**：實現多線程處理，提升大文件上傳性能。

## 功能特性

### 1. XLSX 匯入與匯出

- 支持從 Excel 文件導入數據並在前端顯示。
- 提供數據處理後的匯出功能，格式靈活。

### 2. Ag-Grid 表格編輯

- 支持行內編輯、多選、篩選、排序等功能。
- 自定義表格樣式與功能，滿足複雜業務場景。

### 3. 大文件上傳

- 使用 `spark-md5` 計算文件 MD5 值，實現文件去重驗證。
- 通過 Web Worker 將大文件分片上傳，提升上傳性能並減少主線程阻塞。

## 安裝與使用

### 環境需求

- Node.js >= 16.0.0
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

## 文件結構

```bash
├── public/              # 靜態資源
├── src/
│   ├── components/      # Vue 組件
│   ├── plugins/         # Web Worker 與第三方插件
│   ├── views/           # 頁面視圖
│   ├── utils/           # 工具方法 (e.g., xlsx, 文件處理)
│   ├── App.vue          # 主應用入口
│   └── main.ts          # 項目入口文件
├── package.json         # 項目依賴
├── vite.config.ts       # Vite 配置文件
└── README.md            # 專案說明
```

## 參考資料

- 大文件上傳: https://segmentfault.com/a/1190000043625438
