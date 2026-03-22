# Changelog

All notable changes to the NeuroSync project will be documented in this file.



### Added
- **Unified Settings & Profile Screen:** Created a cohesive user dashboard for managing account details and app preferences.
- **Global Theme Customization:** Implemented `ThemePicker` linked to `ThemeContext`, allowing users to dynamically switch between 7 distinct color palettes (Violet, Blue, Green, Pink, Orange, Gray, Teal) with real-time UI updates.
- **Native Image Picker:** Integrated `expo-image-picker` to allow users to open their device gallery, crop photos to a 1:1 aspect ratio, and update their profile avatar.
- **ADHD-Friendly Preferences:** Added interactive toggle switches for Daily Reminders, Haptic Feedback, and Strict Focus Mode.
- **Secure Logout Flow:** Added an interactive confirmation alert prior to triggering the `logoutUser` service to prevent accidental logouts.

### Changed
- **Responsive UI Scaling:** Replaced static sizing with dynamic dimensions using `useWindowDimensions`, calculating a universal `scale` multiplier to ensure the UI renders perfectly across different device sizes.
- **State Management:** Migrated local state variables to `UserContext` to ensure profile data (Name, Email, Age, About, Image) persists globally across the application.