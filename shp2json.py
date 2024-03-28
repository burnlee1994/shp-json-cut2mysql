import geopandas as gpd
import pandas as pd
from dotenv import load_dotenv
import os

def shp_to_geojson(shp_path, output_path):
    # 读取 Shapefile
    gdf = gpd.read_file(shp_path)

    # 将 None 和 NaN 替换为空字符串
    gdf = gdf.fillna('')

    # 将 GeoDataFrame 转换为 GeoJSON 并保存
    gdf.to_file(output_path, driver='GeoJSON', encoding='utf-8')

if __name__ == '__main__':
    # 加载 .env 文件
    load_dotenv()

    # 从 .env 文件中获取路径
    shp_path = os.getenv('SHP_PATH')
    output_json_path = os.getenv('OUTPUT_JSON_PATH')

    # 调用函数进行转换
    shp_to_geojson(shp_path, output_json_path)
