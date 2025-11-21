/**
 * SmartFit Design System
 * Minimalist Black & White Theme
 */

export const colors = {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#FAFAFA',

    // Text
    textPrimary: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    divider: '#EEEEEE',

    // Interactive States
    active: '#000000',
    inactive: '#CCCCCC',
    disabled: '#E5E5E5',

    // Feedback (minimal, using grayscale)
    success: '#000000',
    error: '#000000',
    warning: '#666666',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
};

export const typography = {
    // Headings
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
        lineHeight: 32,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
        letterSpacing: 0,
        lineHeight: 24,
    },

    // Body
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodyLarge: {
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 28,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },

    // UI Elements
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.1,
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};

export const shadows = {
    none: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const layout = {
    screenPadding: spacing.md,
    sectionSpacing: spacing.lg,
    cardPadding: spacing.md,
    maxContentWidth: 600,
};

// Common component styles
export const commonStyles = {
    card: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.md,
    },
    button: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    buttonPrimary: {
        backgroundColor: colors.active,
    },
    buttonSecondary: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.body.fontSize,
    },
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    layout,
    commonStyles,
};
