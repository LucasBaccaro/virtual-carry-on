# SmartFit Project Documentation

## Overview
SmartFit is a mobile application for virtual try-on experiences, built with React Native (Expo) and powered by Google's Gemini AI. It allows users to upload photos of their garments, remove backgrounds automatically, and generate realistic images of themselves wearing those garments.

## Tech Stack
- **Framework**: React Native (Expo SDK 50+)
- **Language**: TypeScript
- **Styling**: NativeWind (TailwindCSS) & StyleSheet
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Backend**: Supabase (Authentication, Database, Storage)
- **AI**: Google Gemini API
  - **Gemini 3 Pro**: High-quality virtual try-on generation
  - **Gemini 2.5 Flash**: Fast background removal for garments
- **State Management**: React Context API

## Architecture

### Navigation Structure (`src/navigation`)
- **AppNavigator**: Root navigator that switches between Auth and Main flows based on session state.
- **AuthNavigator**: Stack navigator for authentication flow.
  - `Onboarding`: Intro screens.
  - `Login`: Email/password login.
  - `Signup`: User registration.
- **MainNavigator**: Main application flow.
  - **TabNavigator**:
    - `Home`: Outfit creation and virtual try-on interface.
    - `Wardrobe`: Garment management (add/view clothes).
    - `Closet`: Saved outfits gallery.
  - **Stack Screens**:
    - `Profile`: User settings and full-body photo management.
    - `ManageCategories`: Custom categories for outfits.

### State Management (`src/context`)
- **AuthContext**: Manages user session, login, signup, logout, and first-launch state.
- **OutfitContext**: Manages saved outfits and custom outfit categories. Handles CRUD operations.
- **UserPhotoContext**: Manages the user's full-body reference photo used for virtual try-on.

### Services (`src/services`)
- **supabase.ts**: Supabase client initialization and configuration.
- **supabaseService.ts**: Encapsulates all database and storage interactions.
  - **Profiles**: Fetch/update user profile and body photo.
  - **Garments**: Create (with AI background removal), get, delete garments.
  - **Categories**: Manage custom outfit categories.
  - **Outfits**: Save and retrieve generated outfits.
- **gemini.ts**: Interface with Google Generative AI.
  - `generateTryOnImage`: Builds complex prompts for Gemini 3 Pro to generate try-on images preserving user identity.
  - `removeBackground`: Uses Gemini 2.5 Flash to isolate garments on a white background.

## Key Features

### 1. Authentication
- Secure email/password authentication via Supabase Auth.
- Persistent sessions with AsyncStorage.
- Onboarding flow for new users.

### 2. Wardrobe Management
- **Add Garment**: Users can take a photo or upload from gallery.
- **AI Processing**: Automatically removes background from garment photos using Gemini 2.5 Flash.
- **Categorization**: Garments are classified as Upper Body, Lower Body, or Footwear.
- **Storage**: Images are stored in Supabase Storage (`garment-images` bucket).

### 3. Virtual Try-On
- **Model**: Uses Gemini 3 Pro Image Preview model.
- **Process**:
  1. User selects their full-body photo.
  2. User selects garments (Upper, Lower, Footwear).
  3. App builds a prompt enforcing "Identity Preservation" and "Photorealism".
  4. Gemini generates the result.
- **Result**: A realistic image of the user wearing the selected clothes.

### 4. Closet & Organization
- **Saved Outfits**: Users can save successful try-on results.
- **Categories**: Users can create custom categories (e.g., "Summer", "Work") to organize outfits.
- **Filtering**: Filter saved outfits by category.

## Database Schema (Supabase)

### Tables
- **profiles**
  - `id`: uuid (PK, references auth.users)
  - `full_body_photo_url`: text
  - `created_at`: timestamptz
  - `updated_at`: timestamptz

- **garments**
  - `id`: uuid (PK)
  - `user_id`: uuid (FK -> auth.users)
  - `category`: text ('upper', 'lower', 'footwear')
  - `type`: text
  - `description`: text
  - `image_url`: text
  - `created_at`: timestamptz

- **outfit_categories**
  - `id`: uuid (PK)
  - `user_id`: uuid (FK -> auth.users)
  - `name`: text
  - `created_at`: timestamptz

- **saved_outfits**
  - `id`: uuid (PK)
  - `user_id`: uuid (FK -> auth.users)
  - `image_url`: text
  - `model_used`: text
  - `category_id`: uuid (FK -> outfit_categories, nullable)
  - `garment_ids`: text[] (array of garment IDs)
  - `created_at`: timestamptz

### Storage Buckets
- `profile-photos`: Stores user full-body reference photos.
- `garment-images`: Stores processed garment images (background removed).
- `generated-outfits`: Stores final try-on result images.

## Environment Variables
Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key
```

## Development Commands
- `npm start` or `npx expo start`: Start the development server.
- `npm run android`: Run on Android emulator/device.
- `npm run ios`: Run on iOS simulator/device.

## Design System
- **Colors**: Defined in `src/constants/theme.ts`.
- **Typography**: Consistent font sizes and weights.
- **Components**: Reusable components in `src/components` (GlobalHeader, PageHeader, CustomAlert, etc.).
- **Icons**: MaterialIcons from `@expo/vector-icons`.

## Machine Learning & AI Features

### 1. Garment Analysis (`src/services/garmentAnalysis.ts`)
- **Model**: Gemini 2.5 Flash (Multimodal).
- **Functionality**: Analyzes uploaded garment photos to extract metadata automatically.
- **Extracted Data**:
  - Color (e.g., "Navy Blue")
  - Type/Category (e.g., "T-Shirt", "Jeans")
  - Occasion (e.g., "Casual", "Formal")
  - Season (e.g., "Summer", "Winter")
  - Style (e.g., "Minimalist", "Streetwear")
  - Versatility Score (1-10)

### 2. Fashion Agent (`src/services/fashionAgent.ts`)
- **Model**: Gemini 2.0 Flash Exp.
- **Functionality**: Conversational AI assistant that acts as a personal stylist.
- **Features**:
  - Natural language chat interface (`FashionAgentScreen`).
  - Context-aware responses based on user's wardrobe.
  - **Tool Use**: Can autonomously call the recommendation engine when the user asks for outfits.
  - Maintains conversation history for continuity.

### 3. Intelligent Recommendations (`src/services/fashionRecommendations.ts`)
- **Model**: Gemini 2.5 Flash.
- **Functionality**: Generates outfit combinations from the user's existing wardrobe.
- **Logic**:
  - Takes user request (e.g., "something for a date night") + list of available garments.
  - Selects the best combination (Upper + Lower + Footwear).
  - Provides a "Match Score" and reasoning for the choice.
  - **Manual Flow**: Users can also request recommendations directly via the "Regenerar" button in `RecommendationsScreen`.

### 4. Virtual Try-On (Enhanced)
- **Integration**: The "Try On" feature is now integrated into the recommendation cards.
- **Flow**: User accepts a recommendation -> App navigates to `WardrobeScreen` with garments pre-selected -> Auto-generates the try-on image.

## Updated Architecture

### New Services
- `garmentAnalysis.ts`: AI analysis of single garments.
- `fashionAgent.ts`: Chatbot logic and state management.
- `fashionRecommendations.ts`: Core recommendation engine.

### New Screens
- `FashionAgentScreen`: Chat interface for the AI stylist.
- `RecommendationsScreen`: Displays AI-generated outfit suggestions.

### Database Updates
- **garments** table updated with new columns:
  - `metadata`: JSONB (stores AI analysis results).
  - `usage_count`: Integer (tracks how often a garment is worn).
  - `last_worn`: Timestamptz.
