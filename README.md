# Audio Format Converter

A React Native application for converting audio files between different formats using FFmpeg.

## Features

- **Cross-platform**: Works on both iOS and Android
- **Multiple formats**: Supports MP3, WAV, FLAC, OGG, AAC, M4A
- **Local file access**: Browse and convert audio files stored on your device
- **Progress tracking**: Real-time conversion progress with visual feedback
- **Quality settings**: Configure bitrate, sample rate, and channels
- **Clean UI**: Simple and intuitive user interface

## Supported Conversions

### Input Formats
- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- OGG (.ogg)
- AAC (.aac)
- M4A (.m4a)
- WMA (.wma)

### Output Formats
- MP3 (.mp3)
- WAV (.wav)
- AAC (.aac)
- M4A (.m4a)

## Installation

### Prerequisites
- Node.js >= 18
- React Native development environment set up
- Android Studio (for Android)
- Xcode (for iOS)

### Install Dependencies
```bash
npm install
```

### iOS Setup
```bash
cd ios && pod install
```

### Android Setup
No additional setup required, but ensure you have:
- Android SDK >= 21
- Android NDK configured

## Usage

1. **Launch the app**
2. **Select audio file**: Tap "Browse Files" to choose an audio file from your device
3. **Choose output format**: Select MP3, WAV, AAC, or M4A
4. **Convert**: Tap "Convert to [format]" to start conversion
5. **Wait**: View progress as the file is converted
6. **Save**: Converted files are saved to:
   - **Android**: `/storage/emulated/0/Android/data/com.temp/files/AudioConverter/Output/`
   - **iOS**: `/Documents/AudioConverter/Output/`

## Technical Details

### Dependencies
- **FFmpeg**: Audio processing via `ffmpeg-kit-react-native`
- **File System**: File operations via `react-native-fs`
- **Document Picker**: File selection via `@react-native-documents/picker`
- **Progress**: Visual progress via `react-native-progress`

### Permissions

#### Android
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `MANAGE_EXTERNAL_STORAGE` (for Android 11+)

#### iOS
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSAppleMusicUsageDescription`
- `NSDocumentsFolderUsageDescription`

## Development

### Running the App

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### Common Issues

1. **Permission denied on Android**: Ensure storage permissions are granted
2. **FFmpeg not found**: Check that `ffmpeg-kit-react-native` is properly linked
3. **iOS file access**: Ensure all required permissions are added to Info.plist
4. **Large files**: Consider using lower bitrate settings for large audio files

### Android 11+ Storage Access
For Android 11 and above, you may need to:
1. Enable "Allow management of all files" in app settings
2. Or use scoped storage approach

## License

MIT License - feel free to use and modify as needed.
