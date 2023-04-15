# pdf-convert

<br>

## 1. - API 目錄

### Root 路由

[GET /test](#get-test)

[POST /convert](#post-convert)

---

<br>

## 2. - API 資訊

## Root 路由

### GET /test

測試路由

ResponseBody:

```JSON
{
  "status": 200,
  "message": "ok"
}
```

---

### POST /convert

將上傳 text-based PDF 轉換成 image-based PDF，並根據需求回傳 Buffer 或下載檔案

note: 目前 responseType 只支援 buffer 或 file

RequestBody:

```Form-Data
{
  "responseType": "buffer",
  "quality": 3,
  "file": {UPLOAD_PDF_FILE}
}
```

ResponseBody if response type is buffer:

```JSON
{
  "status": 200,
  "data": {
    "message": "convert PDF to image success!",
    "buffer": {
      "type": "Buffer",
      "data": [PDF_FILE_BUFFER]
    }
  }
}
```

ResponseHeader if response type is file:

```JSON
{
  "Content-Type": "application/pdf",
  "Content-Disposition": "attachment; filename=xxx_converted.pdf"
}
```

ResponseBody if response type is file:

```PDF
{DOWNLOAD_PDF_FILE}
```

---
