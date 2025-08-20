import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  outputFormat: 'mp3' | 'wav' | 'aac' | 'm4a';
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
}

export interface ConversionProgress {
  progress: number;
  status: 'idle' | 'converting' | 'completed' | 'error';
  error?: string;
}

export class AudioConverterService {
  static async convertAudio(
    options: ConversionOptions,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<string> {
    let tempInputPath: string | null = null;

    try {
      const { inputPath, outputPath, outputFormat, bitrate = '192k', sampleRate = 44100, channels = 2 } = options;

      // Handle URI input path - copy to local file system if needed
      const localInputPath = await this.prepareInputFile(inputPath);
      tempInputPath = localInputPath !== inputPath ? localInputPath : null;

      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      await RNFS.mkdir(outputDir);

      // Build FFmpeg command with local file path
      const command = [
        '-i',
        `"${localInputPath}"`,
        '-c:a',
        this.getCodecForFormat(outputFormat),
        '-b:a',
        bitrate,
        '-ar',
        sampleRate.toString(),
        '-ac',
        channels.toString(),
        '-y', // Overwrite output file
        `"${outputPath}"`
      ];

      if (onProgress) {
        onProgress({ progress: 10, status: 'converting' });
      }

      console.log("FFmpeg command:", command.join(' '));

      const session = await FFmpegKit.execute(command.join(' '));
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        if (onProgress) {
          onProgress({ progress: 100, status: 'completed' });
        }
        return outputPath;
      } else {
        const logs = await session.getLogs();
        const errorMessage = logs.map(log => log.getMessage()).join('\n');
        console.error('FFmpeg error logs:', errorMessage);
        throw new Error(`Conversion failed: ${errorMessage}`);
      }
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          progress: 0, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      throw error;
    } finally {
      // Clean up temporary input file if created
      if (tempInputPath) {
        try {
          await RNFS.unlink(tempInputPath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary file:', tempInputPath, cleanupError);
        }
      }
    }
  }

  /**
   * Prepares input file for FFmpeg processing
   * Handles content:// URIs on Android and file:// URIs on iOS
   */
  static async prepareInputFile(inputPath: string): Promise<string> {
    // If it's already a local file path, use it directly
    if (inputPath.startsWith('/')) {
      const exists = await RNFS.exists(inputPath);
      if (exists) {
        return inputPath;
      }
    }

    // Handle different URI schemes
    if (inputPath.startsWith('content://') || inputPath.startsWith('file://')) {
      // Create temporary directory
      const tempDir = `${RNFS.TemporaryDirectoryPath}/audio_converter_temp`;
      try {
        await RNFS.mkdir(tempDir);
      } catch (error) {
        // Directory might already exist, ignore
      }

      // Generate temporary file name
      const timestamp = Date.now();
      const fileExtension = this.getFileExtensionFromUri(inputPath);
      const tempFileName = `temp_input_${timestamp}${fileExtension}`;
      const tempFilePath = `${tempDir}/${tempFileName}`;

      try {
        // Copy the file from URI to local temp path
        await RNFS.copyFile(inputPath, tempFilePath);
        
        // Verify the copy was successful
        const exists = await RNFS.exists(tempFilePath);
        if (!exists) {
          throw new Error('Failed to copy file to temporary location');
        }

        console.log(`Copied URI ${inputPath} to local path ${tempFilePath}`);
        return tempFilePath;
      } catch (copyError) {
        console.error('Failed to copy file from URI:', copyError);
        throw new Error(`Unable to access file: ${copyError instanceof Error ? copyError.message : 'Copy failed'}`);
      }
    }

    // If we reach here, try to use the original path
    const exists = await RNFS.exists(inputPath);
    if (exists) {
      return inputPath;
    }

    throw new Error(`Input file not found or inaccessible: ${inputPath}`);
  }

  /**
   * Extracts file extension from URI or file path
   */
  static getFileExtensionFromUri(uri: string): string {
    // Try to extract extension from the URI
    const matches = uri.match(/\.([a-zA-Z0-9]+)(\?|$|#)/);
    if (matches) {
      return '.' + matches[1].toLowerCase();
    }

    // If no extension found, try common patterns
    if (uri.includes('audio')) {
      return '.mp3'; // Default to mp3 for audio files
    }

    return '.tmp'; // Fallback extension
  }

  static getCodecForFormat(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3':
        return 'libmp3lame';
      case 'wav':
        return 'pcm_s16le';
      case 'aac':
      case 'm4a':
        return 'aac';
      case 'ogg':
        return 'libvorbis';
      case 'flac':
        return 'flac';
      default:
        return 'libmp3lame';
    }
  }

  static getSupportedInputFormats(): string[] {
    return ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma'];
  }

  static getSupportedOutputFormats(): string[] {
    return ['mp3', 'wav', 'aac', 'm4a'];
  }

  static async getFileInfo(filePath: string) {
    try {
      const stats = await RNFS.stat(filePath);
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      
      return {
        name: filePath.split('/').pop() || '',
        path: filePath,
        size: stats.size,
        extension,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  static async cleanupTempFiles() {
    const tempDirs = [
      `${RNFS.TemporaryDirectoryPath}/audio_converter`,
      `${RNFS.TemporaryDirectoryPath}/audio_converter_temp`
    ];

    for (const tempDir of tempDirs) {
      try {
        const exists = await RNFS.exists(tempDir);
        if (exists) {
          await RNFS.unlink(tempDir);
          console.log(`Cleaned up temp directory: ${tempDir}`);
        }
      } catch (error) {
        console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
      }
    }
  }

  /**
   * Cleanup old temporary files (files older than 1 hour)
   */
  static async cleanupOldTempFiles() {
    const tempDir = `${RNFS.TemporaryDirectoryPath}/audio_converter_temp`;
    
    try {
      const exists = await RNFS.exists(tempDir);
      if (!exists) return;

      const files = await RNFS.readdir(tempDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds

      for (const fileName of files) {
        const filePath = `${tempDir}/${fileName}`;
        try {
          const stats = await RNFS.stat(filePath);
          const fileTime = new Date(stats.mtime).getTime();
          
          if (fileTime < oneHourAgo) {
            await RNFS.unlink(filePath);
            console.log(`Cleaned up old temp file: ${fileName}`);
          }
        } catch (error) {
          console.warn(`Failed to cleanup old temp file ${fileName}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old temp files:', error);
    }
  }
}
