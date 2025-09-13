# Element Button System Setup Guide

## Overview
The `InteractableImageGenerator` supports **two approaches** for creating pinch buttons for each element in the list. This system generates 3D objects using Snap3D by pressing dedicated buttons for each element.

## Setup Instructions

### Option 1: Dynamic Prefab Creation (Recommended)
1. **Create Button Prefab**:
   - Create a new scene object in Lens Studio
   - Add a **PinchButton** component
   - Add an **Interactable** component (required for PinchButton)
   - Add visual elements (text, mesh, etc.)
   - Save as a **prefab**

2. **Configure the Script**:
   - Assign **snap3DFactory**: Your Snap3DInteractableFactory
   - Assign **elementButtonPrefab**: The prefab you created
   - Configure **elementList**: Array of element names
   - Set **buttonSpacing**: Distance between buttons (default: 2.0)
   - **Optional**: Set **customButtonLabels**: Custom text for each button

3. **Result**: Script automatically creates buttons for each element

### Option 2: Manual Button Assignment (Fallback)
1. **Create Buttons Manually**:
   - Create scene objects for each element button
   - Add **PinchButton** + **Interactable** components to each
   - Position them as desired in your scene

2. **Configure the Script**:
   - Assign **snap3DFactory**: Your Snap3DInteractableFactory
   - Assign **manualButtons**: Array of PinchButton components (in element order)
   - Configure **elementList**: Array of element names

3. **Result**: Script maps existing buttons to elements

### Test the System
1. Run the scene
2. Check console for setup messages and debug information
3. If using prefab: Look for component debug output
4. If using manual: Buttons will be mapped automatically

## How It Works

### Dynamic Button Creation
- The script creates one button for each element in the `elementList`
- Buttons are positioned vertically with the specified spacing
- Each button is automatically connected to generate its corresponding element

### Button Mapping
- Button 0 → Element 0 (fire)
- Button 1 → Element 1 (water)
- Button 2 → Element 2 (earth)
- And so on...

### Runtime Management
- `addElement(element)`: Add a new element and create its button
- `removeElement(element)`: Remove an element and destroy its button
- `updateElementList(newElements)`: Replace the entire list and recreate all buttons
- `clearAllButtons()`: Remove all elements and buttons

## How It Works

### Button Mapping
- Button 0 → Element 0 (fire)
- Button 1 → Element 1 (water)
- Button 2 → Element 2 (earth)
- And so on...

### Element Generation
When a button is pressed:
1. The corresponding element is identified
2. The Snap3DInteractableFactory is called with that element name
3. A 3D object is generated in front of the user
4. Console feedback shows the generation status

## Features

### ✅ Pre-configured Elements
- Fire, Water, Earth, Lightning, Wind, Ice, Plant, Metal
- Easily customizable through the elementList array

### ✅ Individual Button Control
- Each element has its own dedicated button
- Clear mapping between buttons and elements
- Visual feedback through console messages

### ✅ Runtime Management
- Add/remove elements dynamically
- Update the entire element list
- Get current element count and list

## Console Messages

### Setup Messages:
- `🎯 Setting up element buttons...`
- `✅ Set up button 0 for element: fire`
- `✅ Configured 8 element buttons`

### Generation Messages:
- `🎯 Generating fire element...`
- `✅ fire element created successfully: [status]`
- `❌ Failed to create fire element: [error]`

## Public Methods

### `addElement(element: string)`
Adds a new element to the list (requires adding a corresponding button)

### `removeElement(element: string)`
Removes an element from the list

### `updateElementList(newElements: string[])`
Replaces the entire element list

### `getElementList(): string[]`
Returns a copy of the current element list

### `getElementCount(): number`
Returns the number of elements in the list

## Example Usage

```typescript
// Add a new element
generator.addElement("dragon");

// Remove an element
generator.removeElement("ice");

// Update the entire list
generator.updateElementList(["fire", "water", "earth", "dragon"]);

// Get current information
const elements = generator.getElementList();
const count = generator.getElementCount();
```

## Troubleshooting

### Buttons Not Working
1. Ensure PinchButton components are properly assigned
2. Check that the number of buttons matches the number of elements
3. Verify the Snap3DInteractableFactory is assigned

### Elements Not Generating
1. Check Snap3D API key configuration
2. Verify the factory's `snap3DInteractablePrefab` is assigned
3. Look for console error messages

### Button Mapping Issues
1. Ensure buttons are assigned in the correct order
2. Check that elementList and elementButtons arrays have the same length
3. Verify button names and element names match your expectations

## Customization

### Adding New Elements
1. Add the element name to the `elementList` array
2. Create a corresponding PinchButton in the scene
3. Assign the button to the `elementButtons` array

### Changing Element Names
1. Modify the `elementList` array
2. Update any UI text or labels accordingly
3. Ensure Snap3D prompts match your element names

The system is now ready to use! Each button will generate its corresponding 3D element when pressed. 🎉