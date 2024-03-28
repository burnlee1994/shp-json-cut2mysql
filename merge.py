import geopandas as gpd
import json
import math

def shp_to_geojson(shp_path, output_path):
    # 读取 Shapefile
    gdf = gpd.read_file(shp_path)
    # 将 None 和 NaN 替换为空字符串
    gdf = gdf.fillna('')
    # 将 GeoDataFrame 转换为 GeoJSON 并保存
    gdf.to_file(output_path, driver='GeoJSON', encoding='utf-8')

def split_geojson(input_path, output_dir, num_parts=10):
    try:
        # 读取 JSON 文件
        with open(input_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # 提取 features 部分
        features = data['features']

        # 计算每一份的大小
        chunk_size = math.ceil(len(features) / num_parts)

        # 分割 features 并保存为新的 JSON 文件
        for i in range(num_parts):
            # 计算当前分片的起始和结束索引
            start = i * chunk_size
            end = min((i + 1) * chunk_size, len(features))

            # 创建新的 JSON 数据
            new_data = data.copy()  # 复制原始数据
            new_data['features'] = features[start:end]  # 设置新的 features 部分

            # 保存到新文件
            output_path = f'{output_dir}/data_part_{i+1}.json'
            with open(output_path, 'w', encoding='utf-8') as outfile:
                json.dump(new_data, outfile, ensure_ascii=False)

        print("分割完成。")

    except FileNotFoundError:
        print("文件不存在，请检查文件路径。")
    except json.JSONDecodeError:
        print("JSON 文件格式错误，请检查文件内容。")
    except Exception as e:
        print(f"发生错误：{e}")

if __name__ == '__main__':
    shp_path = r'Z:\yaogan\2024zunyiyancaojiance\yandiguihua\huichuan\0327shp\改\hc.shp'
    output_json_path = r'Z:\yaogan\2024zunyiyancaojiance\yandiguihua\huichuan\0327shp\改\output.json'
    output_dir = r'Z:\yaogan\2024zunyiyancaojiance\yandiguihua\huichuan\0327shp\改\cut'

    # 将 Shapefile 轢成 GeoJSON
    shp_to_geojson(shp_path, output_json_path)

    # 将 GeoJSON 分割成多个部分
    split_geojson(output_json_path, output_dir, num_parts=10)
