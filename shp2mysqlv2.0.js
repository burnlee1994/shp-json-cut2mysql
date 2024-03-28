var fs = require("fs");
var mysql = require("mysql");
var Geojson2Wkt = require("geojson2wkt");
var path = require("path");
var util = require("util");
require('dotenv').config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});


connection.connect();

var tableName = process.argv[3];
//var directoryPath = "Z:\\yaogan\\2024zunyiyancaojiance\\yandiguihua\\huichuan\\0327shp\\改\\cut";
var directoryPath = process.argv[2];  // 获取命令行传递的路径参数

var readFileAsync = util.promisify(fs.readFile);
var readdirAsync = util.promisify(fs.readdir);
var queryAsync = util.promisify(connection.query.bind(connection));

async function createTableIfNotExists(tableName) {
    var createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (id INT, geom GEOMETRY)`;
    await queryAsync(createTableSQL);
    console.log(`Table ${tableName} created or already exists.`);
}

async function addColumnIfNotExists(tableName, columnName, columnType) {
    var checkColumnSQL = `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`;
    var result = await queryAsync(checkColumnSQL);
    if (result.length === 0) {
        var addColumnSQL = `ALTER TABLE ${tableName} ADD ${columnName} ${columnType}`;
        await queryAsync(addColumnSQL);
        console.log(`Added column ${columnName} to table ${tableName}.`);
    }
}

(async () => {
    try {
        await createTableIfNotExists(tableName);
        await addColumnIfNotExists(tableName, 'version', 'VARCHAR(255)');

        const files = await readdirAsync(directoryPath);
        const allProperties = new Set();

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

        for (const key of allProperties) {
            var columnType = 'VARCHAR(50)';
            if (key === 'areamu') {
                columnType = 'DECIMAL(8, 2)';
            }
            await addColumnIfNotExists(tableName, key, columnType);
        }

        for (const file of files) {
            if (path.extname(file) === ".json") {
                console.log(`Processing file: ${file}`);
                const data = await readFileAsync(path.join(directoryPath, file), { encoding: "utf-8" });
                let jsonobj = JSON.parse(data);
                var features = jsonobj.features;

                for (const feature of features) {
                    var insertData = [];
                    var insertedFields = [];

                    if ('id' in feature.properties && Number.isInteger(feature.properties['id'])) {
                        insertData.push(feature.properties['id']);
                        insertedFields.push('id');
                    } else {
                        console.error('Missing or invalid id value in feature:', feature);
                        continue;
                    }

                    for (var key in feature.properties) {
                        if (feature.properties.hasOwnProperty(key) && key !== 'id') {
                            insertData.push("'" + feature.properties[key] + "'");
                            insertedFields.push(key);
                        }
                    }

                    if (feature.geometry && feature.geometry.type && feature.geometry.coordinates) {
                        var geometryWKT = Geojson2Wkt.convert(feature.geometry);
                        if (geometryWKT !== 'MULTIPOLYGON()' && geometryWKT !== 'POLYGON()' && geometryWKT !== 'LINESTRING()' && geometryWKT !== 'POINT()') {
                            insertData.push("ST_GeomFromText('" + geometryWKT + "')");
                            insertedFields.push("geom");
                        } else {
                            console.error('Invalid geometry data in feature:', feature);
                            continue;
                        }
                    } else {
                        insertData.push("NULL");
                        insertedFields.push("geom");
                    }

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
        connection.end();
    }
})();
