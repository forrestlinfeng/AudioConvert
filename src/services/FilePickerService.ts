import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';
import { pick, errorCodes, isErrorWithCode } from '@react-native-documents/picker';

export interface AudioFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  extension: string;
}

export class FilePickerService {
  static async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to select audio files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't require explicit permission for document picker
  }

  static async pickAudioFile(): Promise<AudioFile | null> {
    try {
      // Request permission first
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }

      const [file] = await pick({
        type: [
          'audio/*',
          'audio/mpeg',
          'audio/wav',
          'audio/flac',
          'audio/ogg',
          'audio/aac',
          'audio/m4a',
        ],
        allowMultiSelection: false,
      });
     
      if (file && file.uri) {
        return {
          uri: file.uri,
          name: file.name || 'Unknown',
          size: file.size || 0,
          type: file.type || 'audio/*',
          extension: file.name?.split('.').pop()?.toLowerCase() || '',
        };
      }

      return null;
    } catch (error: any) {
      // Use the library's built-in error handling methods
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case errorCodes.OPERATION_CANCELED:
            return null; // User cancelled
          case errorCodes.IN_PROGRESS:
            console.warn('DocumentPicker operation already in progress');
            return null;
          case errorCodes.UNABLE_TO_OPEN_FILE_TYPE:
            throw new Error('Unable to open this file type. Please select a supported audio file.');
          default:
            console.error('File picker error with code:', error.code, error.message);
            throw new Error(`Failed to pick file: ${error.message}`);
        }
      }
      
      // Handle specific error cases that might cause PromiseImpl.reject issues
      if (error && typeof error === 'object') {
        if (error.code === null || error.code === undefined) {
          console.warn(error);
          return null;
        }
        
        // Check for common cancellation patterns
        if (error.message?.includes('canceled') || 
            error.message?.includes('cancelled') ||
            error.message?.includes('User canceled')) {
          return null;
        }
      }
      
      // Log the actual error for debugging
      console.error('File picker error:', error);
      throw new Error(`Failed to pick file: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isSupportedAudioFile(filename: string): boolean {
    const supportedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma'];
    const extension = '.' + filename.split('.').pop()?.toLowerCase();
    return supportedExtensions.includes(extension);
  }

  static async createOutputDirectory(): Promise<string> {
    const outputDir = Platform.select({
      ios: `${RNFS.DocumentDirectoryPath}/Output`,
      android: `${RNFS.ExternalDirectoryPath}/Output`,
      default: `${RNFS.DocumentDirectoryPath}/Output`,
    });

    try {
      await RNFS.mkdir(outputDir);
      return outputDir;
    } catch (error) {
      console.error('Failed to create output directory:', error);
      return RNFS.TemporaryDirectoryPath;
    }
  }

  static async getOutputFilePath(inputFile: AudioFile, outputFormat: string): Promise<string> {
    const outputDir = await this.createOutputDirectory();
    const baseName = inputFile.name.split('.').slice(0, -1).join('.');
    return `${outputDir}/${baseName}.${outputFormat}`;
  }
}
