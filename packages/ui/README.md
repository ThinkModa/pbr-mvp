# PBR UI Package

A comprehensive design system and UI component library for the PBR MVP application, built with React Native and web compatibility.

## 🎨 Design System

### Color Palette

Based on your provided color palette and Figma design:

- **Primary**: Golden Yellow (`#D29507`) - Main brand color
- **Secondary**: Dark Teal (`#265451`) - Supporting brand color  
- **Accent**: Terracotta (`#933B25`) - Accent color
- **Background**: Light Cream (`#FBF6F1`) - Main background
- **Text**: Black (`#040404`) - Primary text color

### Typography

- **Font Family**: Red Hat Display (primary), system fonts (fallback)
- **Primary Weight**: 600 (Semibold)
- **Base Size**: 16px
- **Letter Spacing**: 0.32px (for buttons)

### Components

#### Button
- **Variants**: Primary, Secondary, Outline, Ghost
- **Sizes**: Small, Medium, Large
- **States**: Default, Hover, Disabled, Loading
- **Border Radius**: 100px (fully rounded)

#### TextField
- **States**: Default, Focused, Error, Disabled
- **Border Radius**: 10px
- **Border Color**: #CCCCCC (default)
- **Supports**: Labels, placeholders, error messages, helper text

#### CategoryButton
- **States**: Selected, Unselected, Disabled
- **Border Radius**: 100px (fully rounded)
- **Selection**: Black background with white text when selected

## 🚀 Usage

### Installation

The UI package is already configured in the monorepo. Import components directly:

```typescript
import { Button, TextField, CategoryButton, colorTokens } from '@pbr/ui';
```

### Basic Examples

#### Button
```tsx
<Button variant="primary" size="md" onPress={handlePress}>
  Login
</Button>
```

#### TextField
```tsx
<TextField
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>
```

#### CategoryButton
```tsx
<CategoryButton
  selected={selectedCategory === 'House'}
  onPress={() => setSelectedCategory('House')}
>
  House
</CategoryButton>
```

### Design Tokens

Access design tokens directly:

```typescript
import { colorTokens, textStyles, spacing } from '@pbr/ui';

const styles = {
  container: {
    backgroundColor: colorTokens.ui.background,
    padding: spacing[4], // 16px
  },
  title: {
    ...textStyles.h2,
    color: colorTokens.ui.text.primary,
  },
};
```

## 📱 Platform Support

- **React Native**: Full support for mobile apps
- **Web**: Compatible with React web applications
- **Cross-platform**: Shared design system across platforms

## 🎯 Features

- ✅ **Design System**: Complete color, typography, and spacing system
- ✅ **Components**: Core UI components matching Figma design
- ✅ **TypeScript**: Full type safety and IntelliSense support
- ✅ **Accessibility**: Built with accessibility best practices
- ✅ **Responsive**: Works across different screen sizes
- ✅ **Theming**: Consistent theming across the application

## 🔧 Development

### Adding New Components

1. Create component in `src/components/ComponentName/`
2. Export from `src/components/index.ts`
3. Follow existing patterns for consistency

### Design System Updates

Update design tokens in `src/design-system/` to maintain consistency across all components.

## 📋 Component Status

- ✅ Button
- ✅ TextField  
- ✅ CategoryButton
- 🔄 PropertyCard (planned)
- 🔄 Navigation (planned)
- 🔄 Modal (planned)
- 🔄 Loading (planned)

## 🎨 Figma Integration

This UI package is built to match your Figma design system exactly:

- **Colors**: Extracted from your color palette
- **Typography**: Matches Red Hat Display font specifications
- **Components**: Recreated from Figma component specifications
- **Spacing**: Based on Figma measurements and design tokens

The components are pixel-perfect implementations of your Figma designs, ensuring consistency between design and development.
