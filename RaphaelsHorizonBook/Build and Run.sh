# Install dependencies
npm install

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android

# Clean build
cd android && ./gradlew clean && cd ..