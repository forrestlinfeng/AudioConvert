import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { AudioConverterService } from '../services/AudioConverterService';
import { FilePickerService, AudioFile } from '../services/FilePickerService';

export const AudioConverter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('mp3');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const outputFormats = [
    { label: 'MP3', value: 'mp3' },
    { label: 'WAV', value: 'wav' },
    { label: 'AAC', value: 'aac' },
    { label: 'M4A', value: 'm4a' },
  ];

  const handleFilePick = async () => {
    try {
      const file = await FilePickerService.pickAudioFile();
      if (file) {
        setSelectedFile(file);
        setConversionStatus('idle');
        setOutputPath(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
      console.error('File pick error:', error);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setConversionStatus('converting');
    setConversionProgress(0);

    try {
      const outputFilePath = await FilePickerService.getOutputFilePath(selectedFile, outputFormat);
      
      await AudioConverterService.convertAudio(
        {
          inputPath: selectedFile.uri,
          outputPath: outputFilePath,
          outputFormat: outputFormat as 'mp3' | 'wav' | 'aac' | 'm4a',
        },
        (progress) => {
          setConversionProgress(progress.progress);
          setConversionStatus(progress.status);
        }
      );

      setOutputPath(outputFilePath);
      setConversionStatus('completed');
      Alert.alert('成功', `文件保存路径: ${outputFilePath}`);
    } catch (error) {
      setConversionStatus('error');
      Alert.alert('转换失败', error instanceof Error ? error.message : 'Failed to convert file');
    } finally {
      setIsConverting(false);
    }
  };

  const resetConversion = () => {
    setSelectedFile(null);
    setConversionStatus('idle');
    setConversionProgress(0);
    setOutputPath(null);
    setIsConverting(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>音频格式转换器</Text>
        <Text style={styles.subtitle}>支持的格式: MP3, WAV, FLAC, OGG, AAC, M4A</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>第一步: 选择音频文件</Text>
        <TouchableOpacity style={styles.button} onPress={handleFilePick}>
          <Text style={styles.buttonText}>选择文件</Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>文件名: {selectedFile.name}</Text>
            <Text style={styles.fileDetails}>大小: {FilePickerService.formatFileSize(selectedFile.size)}</Text>
            <Text style={styles.fileDetails}>类型: {selectedFile.extension.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {selectedFile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第二步: 选择输出格式</Text>
          <View style={styles.formatButtons}>
            {outputFormats.map((format) => (
              <TouchableOpacity
                key={format.value}
                style={[
                  styles.formatButton,
                  outputFormat === format.value && styles.formatButtonActive
                ]}
                onPress={() => setOutputFormat(format.value)}
              >
                <Text style={[
                  styles.formatButtonText,
                  outputFormat === format.value && styles.formatButtonTextActive
                ]}>
                  {format.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedFile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第三步: 格式转换</Text>
          <TouchableOpacity
            style={[styles.convertButton, isConverting && styles.convertButtonDisabled]}
            onPress={handleConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>转换中...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>目标格式: {outputFormat.toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isConverting && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Converting audio file...</Text>
          <Progress.Bar
            progress={conversionProgress / 100}
            width={null}
            height={8}
            color="#007AFF"
            unfilledColor="#E5E5EA"
            borderWidth={0}
            borderRadius={4}
          />
          <Text style={styles.progressPercentage}>{Math.round(conversionProgress)}%</Text>
        </View>
      )}

      {conversionStatus === 'completed' && outputPath && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Conversion completed!</Text>
          <Text style={styles.outputPath}>Output: {outputPath}</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetConversion}>
            <Text style={styles.resetButtonText}>Convert Another File</Text>
          </TouchableOpacity>
        </View>
      )}

      {conversionStatus === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Conversion failed. Please try again.</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetConversion}>
            <Text style={styles.resetButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,        // 添加顶部外边距
    marginBottom: 16,     // 保持底部外边距
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
  },
  formatButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
    marginBottom: 8,
  },
  formatButtonActive: {
    backgroundColor: '#007AFF',
  },
  formatButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formatButtonTextActive: {
    color: '#fff',
  },
  convertButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
  },
  convertButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  outputPath: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});