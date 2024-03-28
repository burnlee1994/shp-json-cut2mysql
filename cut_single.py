import json
import math
from dotenv import load_dotenv
import os

try:
    # 加载 .env 文件
    load_dotenv()

    # 从 .env 文件中获取路径
    json_path = os.getenv('OUTPUT_JSON_PATH')

    # 读取 JSON 文件
    with open(json_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # 提取 features 部分
    features = data['features']

    # 计算每一份的大小
    chunk_size = math.ceil(len(features) / 10)

    # 分割 features 并保存为新的 JSON 文件
    for i in range(10):
        # 计算当前分片的起始和结束索引
        start = i * chunk_size
        end = min((i + 1) * chunk_size, len(features))

        # 创建新的 JSON 数据
        new_data = data.copy()  # 复制原始数据
        new_data['features'] = features[start:end]  # 设置新的 features 部分

        # 保存到新文件
        output_dir = os.getenv('OUTPUT_CUT_DIR')
        with open(os.path.join(output_dir, f'data_part_{i+1}.json'), 'w', encoding='utf-8') as outfile:
            json.dump(new_data, outfile, ensure_ascii=False)

    print("分割完成。")

except FileNotFoundError:
    print("文件不存在，请检查文件路径。")
except json.JSONDecodeError:
    print("JSON 文件格式错误，请检查文件内容。")
except Exception as e:
    print(f"发生错误：{e}")
