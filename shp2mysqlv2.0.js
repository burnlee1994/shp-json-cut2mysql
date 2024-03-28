// 引入所需模块
var fs = require("fs");                   // 用于文件系统操作
var mysql = require("mysql");             // 用于 MySQL 数据库操作
var Geojson2Wkt = require("geojson2wkt"); // 用于将 GeoJSON 转换为 WKT 格式
var path = require("path");               // 用于路径操作
var util = require("util");               // 用于实用工具，如将回调函数转换为 Promise
require('dotenv').config();               // 用于加载 .env 文件中的环境变量

// 创建数据库连接对象
var connection = mysql.createConnection({
    host: process.env.DB_HOST,            // 数据库主机地址
    port: process.env.DB_PORT,            // 数据库端口号
    user: process.env.DB_USER,            // 数据库用户名
    password: process.env.DB_PASSWORD,    // 数据库密码
    database: process.env.DB_NAME,        // 数据库名称
    multipleStatements: true              // 允许执行多条 SQL 语句
});

// 建立数据库连接
connection.connect();

// 从命令行参数获取表名和目录路径
var tableName = process.argv[3];          // 第四个参数为表名
var directoryPath = process.argv[2];     // 第三个参数为目录路径

// 将 fs.readFile 和 fs.readdir 方法转换为返回 Promise 的异步函数
var readFileAsync = util.promisify(fs.readFile);
var readdirAsync = util.promisify(fs.readdir);
// 将 connection.query 方法转换为返回 Promise 的异步函数
var queryAsync = util.promisify(connection.query.bind(connection));

// 如果表不存在，则创建表
async function createTableIfNotExists(tableName) {
    var createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (id INT, geom GEOMETRY)`;
    await queryAsync(createTableSQL);
    console.log(`Table ${tableName} created or already exists.`);
}

// 如果列不存在，则向表中添加列
async function addColumnIfNotExists(tableName, columnName, columnType) {
    var checkColumnSQL = `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`;
    var result = await queryAsync(checkColumnSQL);
    if (result.length === 0) {
        var addColumnSQL = `ALTER TABLE ${tableName} ADD ${columnName} ${columnType}`;
        await queryAsync(addColumnSQL);
        console.log(`Added column ${columnName} to table ${tableName}.`);
    }
}

// 主函数
(async () => {
    try {
        // 创建表并添加 'version' 列
        await createTableIfNotExists(tableName);
        await addColumnIfNotExists(tableName, 'version', 'VARCHAR(255)');

        // 读取目录中的所有 GeoJSON 文件
        const files = await readdirAsync(directoryPath);
        // 用于存储所有属性的集合
        const allProperties = new Set();

        // 遍历文件，提取 GeoJSON 中的属性
        for (const file of files) {
            if (path.extname(file) === ".json") {
                const data = await readFileAsync(path.join(directoryPath, file), { encoding: "utf-8" });
                let jsonobj = JSON.parse(data);
                var features = jsonobj.features;
                for (const feature of features) {
                    for (var key in feature.properties) {
                        if (feature.properties.hasOwnProperty(key)) {
                            allProperties.add(key);
                        }
                    }
                }
            }
        }

        // 为表添加所有属性列
        for (const key of allProperties) {
            var columnType = 'VARCHAR(50)';
            if (key === 'areamu') {
                columnType = 'DECIMAL(8, 2)';
            }
            await addColumnIfNotExists(tableName, key, columnType);
        }

        // 遍历文件，将数据插入数据库
        for (const file of files) {
            if (path.extname(file) === ".json") {
                console.log(`Processing file: ${file}`);
                const data = await readFileAsync(path.join(directoryPath, file), { encoding: "utf-8" });
                let jsonobj = JSON.parse(data);
                var features = jsonobj.features;

                for (const feature of features) {
                    var insertData = [];
                    var insertedFields = [];

                    // 检查 feature 的 'id' 属性是否存在且为整数
                    if ('id' in feature.properties && Number.isInteger(feature.properties['id'])) {
                        insertData.push(feature.properties['id']);
                        insertedFields.push('id');
                    } else {
                        console.error('Missing or invalid id value in feature:', feature);
                        continue; // 跳过当前 feature
                    }

                    // 添加其他属性值
                    for (var key in feature.properties) {
                        if (feature.properties.hasOwnProperty(key) && key !== 'id') {
                            insertData.push("'" + feature.properties[key] + "'");
                            insertedFields.push(key);
                        }
                    }

                    // 转换并添加几何数据
                    if (feature.geometry && feature.geometry.type && feature.geometry.coordinates) {
                        var geometryWKT = Geojson2Wkt.convert(feature.geometry);
                        // 检查几何数据是否有效
                        if (geometryWKT !== 'MULTIPOLYGON()' && geometryWKT !== 'POLYGON()' && geometryWKT !== 'LINESTRING()' && geometryWKT !== 'POINT()') {
                            insertData.push("ST_GeomFromText('" + geometryWKT + "')");
                            insertedFields.push("geom");
                        } else {
                            console.error('Invalid geometry data in feature:', feature);
                            continue; // 跳过当前 feature
                        }
                    } else {
                        insertData.push("NULL");
                        insertedFields.push("geom");
                    }

                    // 构建并执行插入 SQL 语句
                    var insertSQL = "INSERT INTO " + tableName + " (" + insertedFields.join(", ") + ") VALUES (" + insertData.join(", ") + ");";
                    try {
                        await queryAsync(insertSQL);
                    } catch (err) {
                        console.error(`Error inserting data for feature ID ${feature.properties['id']}:`, err);
                    }
                }
            }
        }

        console.log(`Inserted records into ${tableName}`);
    } catch (err) {
        console.error(err);
    } finally {
        // 关闭数据库连接
        connection.end();
    }
})();
