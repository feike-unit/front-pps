#!/bin/bash

# 等待 Spring Boot 应用启动
echo "等待 Spring Boot 应用启动..."
while ! curl -s http://localhost:8080/v3/api-docs > /dev/null; do
    sleep 2
done

# 获取 API 文档并保存
echo "正在获取 API 文档..."
curl -s http://localhost:8080/v3/api-docs > apidocs.json

if [ $? -eq 0 ]; then
    echo "API 文档已成功更新到 apidocs.json"
else
    echo "获取 API 文档失败"
    exit 1
fi 