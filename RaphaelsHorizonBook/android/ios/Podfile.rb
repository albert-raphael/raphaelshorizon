require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '13.0'

target 'RaphaelsHorizonBook' do
  config = use_native_modules!
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )
  
  # Permissions
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-Camera', :path => "#{permissions_path}/Camera"
  pod 'Permission-PhotoLibrary', :path => "#{permissions_path}/PhotoLibrary"
  pod 'Permission-MediaLibrary', :path => "#{permissions_path}/MediaLibrary"
  
  # Vector Icons
  pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'
  
  # WebView
  pod 'react-native-webview', :path => '../node_modules/react-native-webview'
  
  # File System
  pod 'RNFS', :path => '../node_modules/react-native-fs'
  
  # Audio
  pod 'react-native-track-player', :path => '../node_modules/react-native-track-player'
  
  # Firebase
  pod 'Firebase/Auth'
  pod 'Firebase/Core'
  
  # Google Sign-In
  pod 'GoogleSignIn'
  
  post_install do |installer|
    react_native_post_install(installer)
    
    # Workaround for Xcode 14.3
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
      end
    end
  end
end