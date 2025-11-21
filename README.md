# SmartFit - Virtual Try-On MVP

A mobile app that uses Google Gemini 3 Pro Image Preview to create realistic virtual try-on experiences.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `.env` file
3. Add your key:
```
EXPO_PUBLIC_GOOGLE_API_KEY=your_actual_api_key_here
```

### 3. Run the App
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Project Structure
```
SmartFit/
├── src/
│   ├── components/
│   │   ├── GarmentCarousel.tsx    # Horizontal garment selector
│   │   └── ImagePreview.tsx       # Image display with compare
│   ├── screens/
│   │   └── TryOnScreen.tsx        # Main screen
│   ├── services/
│   │   └── gemini.ts              # Gemini API integration
│   ├── constants/
│   │   └── mockData.ts            # Mock user and garments
│   └── types/
│       └── index.ts               # TypeScript interfaces
└── assets/
    └── images/                    # User and garment images
```

## 🎨 Features
- ✨ AI-powered virtual try-on using Gemini 3 Pro
- 🖼️ Press and hold to compare original vs generated
- 📱 Modern, responsive UI with NativeWind
- 🎯 Smart composition-based image generation

## 🔧 Customization

### Add Your Own Images
Replace the placeholder images in `assets/images/`:
- `user.png` - Full body photo of a person
- `shirt_black.png`, `shirt_blue.png`, `jeans.png` - Garment photos

### Add More Garments
Edit `src/constants/mockData.ts` to add more items to the `mockGarments` array.

## 📝 Notes
- The app uses **Gemini 3 Pro Image Preview** for high-quality results
- Images are processed locally and sent to Gemini API
- No backend required - all data is local

## 🐛 Troubleshooting
- **"API Key not configured"**: Make sure you've added your key to `.env`
- **"Failed to generate"**: Check your internet connection and API quota
- **Images not loading**: Ensure images are in `assets/images/` folder

## 📄 License
MIT
