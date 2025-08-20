# Android程序仿真完整指南

本指南将帮助您在Android模拟器上运行这个React Native应用程序。

## 环境要求

### 1. Java开发环境
- **JDK 17** (推荐) 或 JDK 11
- 确保设置了 `JAVA_HOME` 环境变量

### 2. Android开发环境
- **Android Studio** (最新版本)
- **Android SDK** (API Level 35)
- **Android SDK Build-Tools** (35.0.0)
- **Android NDK** (27.1.12297006)

## 安装步骤

### 步骤1: 安装Android Studio
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 启动Android Studio并完成初始设置
3. 安装推荐的SDK组件

### 步骤2: 配置SDK和环境变量
在你的 `.bashrc` 或 `.zshrc` 文件中添加：

```bash
# Android SDK路径 (根据实际安装路径调整)
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Java环境
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home  # macOS示例
```

重新加载配置：
```bash
source ~/.zshrc  # 或 source ~/.bashrc
```

### 步骤3: 安装必要的SDK组件
打开Android Studio，进入 SDK Manager，确保安装：
- **Android 15.0 (API 35)** - 对应项目的 compileSdkVersion
- **Android SDK Build-Tools 35.0.0**
- **Android Emulator**
- **Android SDK Platform-Tools**
- **Android NDK (Side by side) 27.1.12297006**

## 创建和配置Android模拟器

### 方法1: 通过Android Studio图形界面
1. 打开Android Studio
2. 点击 "Device Manager" 或 "AVD Manager"
3. 点击 "Create Device"
4. 选择设备类型（推荐 Pixel 系列）
5. 选择系统镜像：
   - **推荐**: Android 15.0 (API 35) x86_64
   - **最低要求**: Android 7.0 (API 24) 
6. 配置AVD设置：
   - RAM: 至少2GB，推荐4GB
   - Internal Storage: 至少6GB
   - 启用Hardware acceleration
7. 完成创建并启动模拟器

### 方法2: 通过命令行
```bash
# 列出可用的系统镜像
sdkmanager --list | grep system-images

# 安装系统镜像 (Android 15)
sdkmanager "system-images;android-35;google_apis;x86_64"

# 创建AVD
avdmanager create avd -n "ReactNative_Emulator" -k "system-images;android-35;google_apis;x86_64"

# 启动模拟器
emulator -avd ReactNative_Emulator
```

## 运行应用程序

### 1. 准备项目依赖
```bash
# 安装Node.js依赖
npm install

# 清理旧的构建文件（如果需要）
cd android
./gradlew clean
cd ..
```

### 2. 启动Metro服务器
在一个终端窗口中：
```bash
npm start
# 或
npx react-native start
```

### 3. 启动Android模拟器
确保至少有一个Android模拟器正在运行：
```bash
# 检查运行的模拟器
adb devices

# 如果没有模拟器运行，启动一个
emulator -avd ReactNative_Emulator
```

### 4. 构建并运行应用
在另一个终端窗口中：
```bash
# 构建并安装到模拟器
npm run android
# 或
npx react-native run-android
```

## 验证和测试功能

### 测试应用功能
1. **文件选择功能**: 测试音频文件选择
2. **文件系统权限**: 确保应用可以访问文件
3. **音频处理**: 验证音频转换功能
4. **用户界面**: 检查界面在不同屏幕尺寸下的显示

### 开发者工具
- **React Native Debugger**: 调试JavaScript代码
- **Flipper**: Facebook的移动应用调试平台
- **Chrome DevTools**: 通过Metro服务器调试

## 常见问题排查

### 问题1: "SDK location not found"
**解决方案**: 确保 `ANDROID_HOME` 环境变量正确设置

### 问题2: 模拟器启动失败
**解决方案**: 
- 检查HAXM或Hyper-V是否正确安装
- 确保有足够的RAM分配给模拟器
- 尝试使用x86_64系统镜像

### 问题3: 应用安装失败
**解决方案**:
```bash
# 清理并重新构建
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### 问题4: Metro服务器连接问题
**解决方案**:
```bash
# 重置Metro缓存
npx react-native start --reset-cache

# 或者手动端口转发
adb reverse tcp:8081 tcp:8081
```

### 问题5: 权限问题
在模拟器中手动授予应用所需权限：
- 存储权限（文件访问）
- 音频权限（如果需要录音功能）

## 性能优化建议

1. **模拟器配置**:
   - 使用硬件加速
   - 分配充足的RAM（4GB+）
   - 启用快照功能

2. **开发模式优化**:
   - 关闭不必要的开发者选项
   - 使用Release构建进行性能测试

3. **网络配置**:
   - 项目已配置阿里云Maven镜像，提升国内下载速度

## 生产环境测试

### 创建Release构建
```bash
cd android
./gradlew assembleRelease
```

### 安装Release版本到模拟器
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## 总结

通过以上步骤，您应该能够：
1. 成功设置Android开发环境
2. 创建并运行Android模拟器
3. 在模拟器上运行React Native应用
4. 测试应用的各项功能
5. 解决常见的环境问题

如果遇到问题，请检查环境变量设置、SDK版本兼容性和模拟器配置。
