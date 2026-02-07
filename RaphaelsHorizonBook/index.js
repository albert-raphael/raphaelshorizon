import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Initialize offline manager
import { OfflineManager } from './src/services/OfflineManager';
OfflineManager.initialize().catch(console.error);

// Register the app
AppRegistry.registerComponent(appName, () => App);