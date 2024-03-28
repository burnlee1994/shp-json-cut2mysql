# 项目名称

项目简介。

## 环境配置
python 3.9
node  v12.14.0

本项目使用 `.env` 文件来管理环境变量。请按照以下步骤配置环境变量：

1. 在项目根目录创建一个名为 `.env` 的文件。

2. 将以下内容添加到 `.env` 文件中，并根据您的实际情况修改相应的值：

   ```plaintext
   # js文件引用
   DB_HOST=数据库主机地址
   DB_PORT=数据库端口
   DB_USER=数据库用户名
   DB_PASSWORD=数据库密码
   DB_NAME=数据库名称

   # py文件引用
   # 基础路径
   BASE_PATH

   # shp文件所在路径（包含shpfile文件名）
   SHP_PATH=${BASE_PATH}\**.shp
   # shp转换成的json文件路径（包含json文件名,如果路径不存在则创建）
   OUTPUT_JSON_PATH=${BASE_PATH}\**.json
   # json文件切分后的输出目录（如果路径不存在则创建）
   OUTPUT_CUT_DIR=${BASE_PATH}\**
## 使用说明
### 环境准备
确保已经安装了 Python 和以下 Python 包：

geopandas
pandas
python-dotenv
在项目根目录下，运行以下命令安装：

```bash
pip install geopandas pandas python-dotenv
```
### 安装 Node.js 依赖：
确保已经安装了 Node.js 和以下 Node.js 包：

mysql
geojson2wkt
dotenv
在项目根目录下，运行以下命令安装：
```bash
npm install mysql geojson2wkt dotenv
```

### 运行脚本
运行以下命令来执行整个处理流程，包括将 Shapefile 转换为 GeoJSON、切分 GeoJSON 文件，以及将数据导入 MySQL 数据库：
```bash
python shp2json-cutjson-json2mysql.py
```

## 注意事项
- 确保 .env 文件中的路径和数据库配置正确。
- 在运行脚本之前，确保已经安装了所有必要的依赖包

## 作者
Burnlee
