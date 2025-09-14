import { ASRQueryController } from "./ASRQueryController";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
import { mergeTitles } from './MergeManager';

@component
export class InteractableSnap3DGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Element Generator with Pinch Buttons")
  @input
  snap3DFactory: Snap3DInteractableFactory;
  
  @ui.separator
  @ui.label("Element Button Prefab")
  @input
  @hint("Prefab to instantiate for each button")
  @allowUndefined
  elementButtonPrefab: ObjectPrefab | undefined;

  @ui.separator
  @ui.label("Manual Buttons (Fallback)")
  @input
  @hint("Manually created PinchButton components (one for each element, in order)")
  @allowUndefined
  manualButtons: PinchButton[] = [];
  
  @ui.separator
  @ui.label("Element List")
  @input
  elementList: string[] = [
    "fire",
    "water", 
    "ground",
    "air",
    "life",
    "science",
    "concept"
  ];

  @ui.separator
  @ui.label("Layout Settings")
  @input
  buttonSpacing: number = 10.0;

  @ui.separator
  @ui.label("3D Object Management")
  @input
  @hint("Maximum number of 3D objects to keep on screen at once")
  max3DObjects: number = 2;

  private generatedButtons: SceneObject[] = [];
  private generated3DObjects: SceneObject[] = [];
  private buttonsInitialized: boolean = false;
  private collisionProcessing: boolean = false; // Prevent duplicate collision processing

  onAwake() {
    print("🚀 InteractableSnap3DGenerator onAwake called");
    this.createEvent("OnStartEvent").bind(() => {
      print("🎯 OnStartEvent triggered - setting up buttons");
      this.setupElementButtons();
    });
    
    // Set up the generator reference in the factory
    if (this.snap3DFactory) {
      (this.snap3DFactory as any).generator = this;
      print("✅ Set generator reference in factory");
    }
  }

  onUpdate() {
    // Sync the max3DObjects setting with the factory (only when it actually changes)
    if (this.snap3DFactory) {
      const currentMax = this.snap3DFactory.getObjectCount();
      // Only update if the max3DObjects setting is different from what we expect
      // Don't update based on current object count, only on setting changes
      
      // Periodic cleanup every 60 frames (about once per second at 60fps)
      if ((global as any).frameCount % 60 === 0) {
        this.snap3DFactory.cleanupDestroyedObjectsPublic();
      }
    }
  }

  private setupElementButtons() {
    if (this.buttonsInitialized) {
      print("⚠️ Buttons already initialized, skipping setup");
      return;
    }
    
    print("🎯 Setting up element buttons...");
    if (this.elementButtonPrefab) {
      // Use prefab to create buttons dynamically
      this.createButtonsFromPrefab();
    } else if (this.manualButtons && this.manualButtons.length > 0) {
      // Use manually assigned buttons
      this.setupManualButtons();
    } else {
      // Provide setup instructions
      this.provideSetupInstructions();
    }
    
    this.buttonsInitialized = true;
  }

  private createButtonsFromPrefab() {
    print("🔧 Creating buttons from prefab...");
    print(`📋 Element list: ${JSON.stringify(this.elementList)}`);
    
    // Clear existing buttons
    this.generatedButtons.forEach(button => button.destroy());
    this.generatedButtons = [];

    // Create a button for each element
    this.elementList.forEach((element, index) => {
      print(`🔧 Creating button ${index + 1}/${this.elementList.length} for element: ${element}`);
      this.createElementButton(element, index);
    });

    print(`✅ Created ${this.elementList.length} dynamic buttons from prefab`);
    print(`📊 Total generated buttons: ${this.generatedButtons.length}`);
  }

  private setupManualButtons() {
    print("🔧 Setting up manual buttons...");
    
    // Map each manual button to its corresponding element
    this.manualButtons.forEach((button, index) => {
      if (index < this.elementList.length) {
        const element = this.elementList[index];
        button.onButtonPinched.add(() => {
          this.generateElement(element);
        });
        print(`✅ Mapped manual button ${index} to element: ${element}`);
      } else {
        print(`⚠️ Manual button ${index} has no corresponding element`);
      }
    });

    print(`✅ Configured ${this.manualButtons.length} manual buttons for ${this.elementList.length} elements`);
  }

  private provideSetupInstructions() {
    print("📋 Button setup instructions:");
    print("Option 1: Create a button prefab and assign it to 'Button Prefab'");
    print("Option 2: Create PinchButton objects manually and assign them to 'Manual Buttons'");
    print("");
    this.createSimpleButtons();
  }

  private createSimpleButtons() {
    print("🔧 Creating simple fallback buttons...");
    
    // Clear existing buttons
    this.generatedButtons.forEach(button => button.destroy());
    this.generatedButtons = [];

    // Create simple buttons for each element
    this.elementList.forEach((element, index) => {
      this.createSimpleButton(element, index);
    });
    
    print(`✅ Created ${this.elementList.length} simple fallback buttons`);
    print("💡 For better visuals, create a button prefab with PinchButton + Interactable components and assign it to the script.");
  }

  private createSimpleButton(element: string, index: number) {
    // In Lens Studio, we can't create scene objects programmatically
    // Instead, we'll provide clear instructions for manual setup
    const column = index % 2; // 0 for left column, 1 for right column
    const row = Math.floor(index / 2); // Row number (0, 1, 2, ...)
    const xOffset = column === 0 ? -this.buttonSpacing * 1.25 : this.buttonSpacing * 1.25;
    const yOffset = -row * this.buttonSpacing - 10.0;
    print(`📝 Element ${index + 1}: ${element}`);
    print(`   - Create a scene object named "ElementButton_${element}"`);
    print(`   - Add PinchButton component`);
    print(`   - Add Interactable component (required for PinchButton)`);
    print(`   - Position at X: ${xOffset}, Y: ${yOffset} (2-column layout with moderate spacing, column: ${column}, row: ${row})`);
    print(`   - Connect to generateElement("${element}") function`);
  }

  private createElementButton(element: string, index: number) {
    print(`🔧 Creating button for element: ${element} at index: ${index}`);
    
    // Check if a button with this name already exists
    const existingButton = this.generatedButtons.find(btn => btn.name === `ElementButton_${element}`);
    if (existingButton) {
      print(`⚠️ Button for ${element} already exists, skipping creation`);
      return;
    }
    
    if (!this.elementButtonPrefab) {
      print(`❌ Cannot create button for ${element}: No prefab assigned`);
      return;
    }

    try {
      // Create button object using standard prefab instantiation
      const buttonObject = this.elementButtonPrefab.instantiate(this.sceneObject);
      buttonObject.name = `ElementButton_${element}`;
      print(`📝 Created button object: ${buttonObject.name}`);
      
      // Position the button - 2 column layout with moderate column spacing
      const column = index % 2; // 0 for left column, 1 for right column
      const row = Math.floor(index / 2); // Row number (0, 1, 2, ...)
      const xOffset = column === 0 ? -this.buttonSpacing * 1.25 : this.buttonSpacing * 1.25;
      const yOffset = -row * this.buttonSpacing - 10.0;
      buttonObject.getTransform().setLocalPosition(new vec3(xOffset, yOffset, 0));
      print(`📍 Positioned ${element} button at X: ${xOffset}, Y: ${yOffset} (index: ${index}, column: ${column}, row: ${row})`);

      // Debug: List all components on the prefab
      try {
        const allComponents = buttonObject.getComponents(BaseScriptComponent.getTypeName());
        print(`🔍 Debug: Prefab for ${element} has ${allComponents.length} components:`);
        allComponents.forEach((comp, i) => {
          print(`   ${i}: ${comp.getTypeName()}`);
        });
      } catch (debugError) {
        print(`🔍 Debug: Could not list components: ${debugError}`);
      }

      // Get the PinchButton component from the instantiated prefab
      let pinchButton: PinchButton | null = null;
      
      try {
        // Try using getTypeName() - this should work
        pinchButton = buttonObject.getComponent(PinchButton.getTypeName()) as PinchButton;
        print(`🔍 Successfully found PinchButton component`);
      } catch (error) {
        print(`🔍 Failed to get PinchButton component: ${error}`);
        print(`🔍 This suggests the prefab doesn't have a PinchButton component`);
      }
      if (pinchButton) {
        print(`🔍 PinchButton found for ${element}`);
        
        // Check the children of the button object
        this.checkButtonChildren(buttonObject, element);
        
        pinchButton.onButtonPinched.add(() => {
          this.generateElement(element);
        });
        print(`✅ Created button for element: ${element} at index ${index}`);
      } else {
        print(`❌ PinchButton component not found on prefab for element: ${element}`);
        print(`💡 Make sure your prefab has a PinchButton component added to it!`);
        print(`💡 Try using the manual buttons approach instead.`);
        
        // Check if the prefab has any components at all
        try {
          const allComponents = buttonObject.getComponents(BaseScriptComponent.getTypeName());
          print(`🔍 Prefab has ${allComponents.length} components total`);
          if (allComponents.length === 0) {
            print(`❌ Prefab appears to be empty! Make sure you added components before creating the prefab.`);
          }
        } catch (e) {
          print(`🔍 Could not check prefab components: ${e}`);
        }
      }

      // Store reference for cleanup
      this.generatedButtons.push(buttonObject);
      
    } catch (error) {
      print(`❌ Error creating button for ${element}: ${error}`);
      print(`💡 Try using the manual buttons approach instead.`);
    }
  }

  private checkButtonChildren(buttonObject: SceneObject, element: string) {
    try {
      print(`🔍 Checking children of button object for ${element}:`);
      
      // Get the scene object that has the PinchButton component
      const pinchButtonSceneObject = buttonObject;
      
      // Try to get children using different methods
      let children: SceneObject[] = [];
      
      // Method 2: Try to access children property directly
      try {
        const children = (pinchButtonSceneObject as any).children;
        print(`   Found ${children.length} children`);
        // Print children in a simple format
        print(`   Children array:`);
        children.forEach((child, i) => {
          print(`     [${i}] ${child.name} (${typeof child})`);
        });
        
        // Print detailed info about each child
        children.forEach((child, index) => {
          print(`   Child ${index}:`);
          print(`     Name: ${child.name}`);
          print(`     Type: ${typeof child}`);
          print(`     Constructor: ${child.constructor.name}`);
          
          // Try to get more properties
          try {
            const keys = Object.keys(child);
            print(`     Properties: ${keys.join(', ')}`);
          } catch (e) {
            print(`     Could not get properties: ${e}`);
          }
        });
        
        if (children.length > 0) {
          const firstChild = children[0];
          print(`   First child: ${firstChild.name}`);
          
          // Check components on the first child - try multiple approaches
          print(`   Checking "Launch Text" object for text...`);
          
          // Method 1: Try to get Text component directly
          try {
            const textComponent = firstChild.getComponent("Text") as Text;
            if (textComponent) {
              print(`   ✅ Found Text component directly: "${textComponent.text}"`);
              textComponent.text = element.toUpperCase();
              print(`   ✅ Updated Text component to: "${element.toUpperCase()}"`);
            } else {
              print(`   ❌ No Text component found directly`);
            }
          } catch (e) {
            print(`   ❌ Text component access failed: ${e}`);
          }
          
          // Method 2: Try to get all components (with proper argument)
          try {
            const allComponents = firstChild.getComponents("Component");
            print(`   Found ${allComponents.length} components on "Launch Text":`);
            
            allComponents.forEach((comp, compIndex) => {
              print(`     Component ${compIndex}: ${comp.constructor.name}`);
              
              // Check if this component has text
              if ((comp as any).text !== undefined) {
                print(`     -> Has text property: "${(comp as any).text}"`);
                
                // Try to update the text
                (comp as any).text = element.toUpperCase();
                print(`     -> Updated text to: "${element.toUpperCase()}"`);
              }
            });
          } catch (e) {
            print(`   ℹ️ Could not get all components: ${e}`);
          }
        } else {
          print(`   No children found`);
        }
      } catch (e) {
        print(`   Method 2 failed: ${e}`);
      }

    } catch (error) {
      print(`🔍 Error checking button children: ${error}`);
    }
  }

  private generateElement(element: string) {
    print(`🎯 Generating ${element} element...`);
    
    if (!this.snap3DFactory) {
      print("❌ Snap3DInteractableFactory not assigned!");
      return;
    }

    // Check if factory is available
    if (!(this.snap3DFactory as any).avaliableToRequest) {
      print("⏳ Snap3D factory is busy, please wait...");
      return;
    }

    // Check if we need to remove the oldest object before creating a new one

    // Reset the factory's availability flag

    // Generate the element
    this.snap3DFactory.createInteractable3DObject(element)
      .then((result) => {
        print(`✅ ${element} element created successfully: ${result.status}`);
        print(`📝 Object tracked by factory: ${result.sceneObject.name}`);
      })
      .catch((error) => {
        print(`❌ Failed to create ${element} element: ${error}`);
        print(`💡 This might be due to:`);
        print(`   - Missing or invalid Snap3D API key`);
        print(`   - Snap3D service unavailable`);
        print(`   - Rate limiting (too many requests)`);
        print(`   - Invalid prompt format`);
        
        // Reset availability flag on error
        (this.snap3DFactory as any).avaliableToRequest = true;
      });
  }

  // Public methods for runtime management
  public addElement(element: string) {
    if (!this.elementList.includes(element)) {
      this.elementList.push(element);
      const index = this.elementList.length - 1;
      this.createElementButton(element, index);
      this.repositionButtons();
      print(`✅ Added element: ${element} to list`);
    }
  }

  public removeElement(element: string) {
    const index = this.elementList.indexOf(element);
    if (index > -1) {
      this.elementList.splice(index, 1);
      
      // Find and destroy the corresponding button
      const buttonToRemove = this.generatedButtons.find(btn => btn.name === `ElementButton_${element}`);
      if (buttonToRemove) {
        buttonToRemove.destroy();
        this.generatedButtons = this.generatedButtons.filter(btn => btn !== buttonToRemove);
      }
      
      this.repositionButtons();
      print(`✅ Removed element: ${element} from list`);
    }
  }

  public updateElementList(newElements: string[]) {
    // Clear existing buttons
    this.generatedButtons.forEach(button => button.destroy());
    this.generatedButtons = [];
    
    // Update element list
    this.elementList = [...newElements];
    
    // Create new buttons
    this.elementList.forEach((element, index) => {
      this.createElementButton(element, index);
    });
    
    print(`✅ Updated element list with ${newElements.length} elements`);
  }

  private repositionButtons() {
    this.generatedButtons.forEach((button, index) => {
      // 2 column layout with moderate column spacing - reposition all buttons
      const column = index % 2; // 0 for left column, 1 for right column
      const row = Math.floor(index / 2); // Row number (0, 1, 2, ...)
      const xOffset = column === 0 ? -this.buttonSpacing * 1.25 : this.buttonSpacing * 1.25;
      const yOffset = -row * this.buttonSpacing - 10.0;
      button.getTransform().setLocalPosition(new vec3(xOffset, yOffset, 0));
      print(`🔄 Repositioned button ${index}: ${button.name} at X: ${xOffset}, Y: ${yOffset} (column: ${column}, row: ${row})`);
    });
    print(`📊 Repositioned ${this.generatedButtons.length} buttons in 2-column layout with moderate column spacing: ${this.buttonSpacing}`);
  }

  public getElementList(): string[] {
    return [...this.elementList];
  }

  public getElementCount(): number {
    return this.elementList.length;
  }

  public getButtonCount(): number {
    return this.generatedButtons.length;
  }

  public clearAllButtons() {
    this.generatedButtons.forEach(button => button.destroy());
    this.generatedButtons = [];
    this.elementList = [];
    this.buttonsInitialized = false;
    print("✅ Cleared all element buttons and reset initialization flag");
  }

  public resetButtons() {
    print("🔄 Resetting buttons...");
    this.clearAllButtons();
    this.setupElementButtons();
  }

  public removeDuplicateButtons() {
    print("🔍 Checking for duplicate buttons...");
    const buttonNames = new Set<string>();
    const uniqueButtons: SceneObject[] = [];
    
    this.generatedButtons.forEach(button => {
      if (buttonNames.has(button.name)) {
        print(`🗑️ Removing duplicate button: ${button.name}`);
        button.destroy();
      } else {
        buttonNames.add(button.name);
        uniqueButtons.push(button);
      }
    });
    
    this.generatedButtons = uniqueButtons;
    print(`✅ Removed duplicates. Now have ${this.generatedButtons.length} unique buttons`);
  }

  // 3D Object Management Methods
  public setMax3DObjects(max: number) {
    if (this.snap3DFactory) {
      this.snap3DFactory.setMaxObjects(max);
      this.max3DObjects = max;
    } else {
      print("❌ Snap3DInteractableFactory not assigned!");
    }
  }

  public clearAll3DObjects() {
    if (this.snap3DFactory) {
      this.snap3DFactory.clearAllObjects();
    } else {
      print("❌ Snap3DInteractableFactory not assigned!");
    }
  }

  public get3DObjectCount(): number {
    if (this.snap3DFactory) {
      return this.snap3DFactory.getObjectCount();
    }
    return 0;
  }

  public get3DObjects(): SceneObject[] {
    if (this.snap3DFactory) {
      return this.snap3DFactory.getObjects();
    }
    return [];
  }

  public cleanupDestroyed3DObjects() {
    if (this.snap3DFactory) {
      this.snap3DFactory.cleanupDestroyedObjectsPublic();
    } else {
      print("❌ Snap3DInteractableFactory not assigned!");
    }
  }

  public get3DObjectStatus() {
    if (this.snap3DFactory) {
      this.snap3DFactory.getObjectStatus();
    } else {
      print("❌ Snap3DInteractableFactory not assigned!");
    }
  }

  public forceResetFactory() {
    if (this.snap3DFactory) {
      this.snap3DFactory.forceResetFactory();
    } else {
      print("❌ Snap3DInteractableFactory not assigned!");
    }
  }

  private async generateObjects() {
    try {
      // Get the forward position from the camera
      const wcfmp = WorldCameraFinderProvider.getInstance();
      const centerPosition = wcfmp.getForwardPosition(100);
      
      // Create positions side by side (left and right of center)
      const spacing = 20; // Distance between objects (increased to prevent collision)
      const leftPosition = centerPosition.add(new vec3(-spacing, 0, 0));
      const rightPosition = centerPosition.add(new vec3(spacing, 0, 0));
      
      // Generate objects at specific positions
      await this.snap3DFactory.createInteractable3DObject("flame", leftPosition);
      await this.snap3DFactory.createInteractable3DObject("chicken", rightPosition);
    } catch (error) {
      print("Error generating objects: " + error);
    }
  }

  /**
   * Subscribe to collision events from a Snap3D object
   */
  public subscribeToCollisionEvents(snap3DInteractable: any) {
    if (snap3DInteractable && snap3DInteractable.onObjectDeleted) {
      snap3DInteractable.onObjectDeleted.add((data: any) => {
        this.onObjectDeleted(data);
      });
      print(`✅ Subscribed to collision events for ${snap3DInteractable.sceneObject?.name || 'unknown object'}`);
    } else {
      print(`❌ Cannot subscribe to collision events - invalid Snap3DInteractable`);
    }
  }

  /**
   * Event handler called when a Snap3D object is deleted due to collision
   */
  public async onObjectDeleted(data: {objectName: string, elementType: string, collisionPartner?: string}) {
    print(`🎯 Object deleted event received:`);
    print(`   Object: ${data.objectName}`);
    print(`   Element: ${data.elementType}`);
    if (data.collisionPartner) {
      print(`   Collision Partner: ${data.collisionPartner}`);
      print(`💥 COLLISION DETECTED: ${data.elementType} + ${data.collisionPartner}`);
      
      // Only process collision once to prevent duplicates
      if (!this.collisionProcessing) {
        this.collisionProcessing = true;
        
        // You can add custom logic here, such as:
        // - Generate a new combined object
        // - Update UI elements
        // - Play sound effects
        // - Update score or statistics
        // - Trigger animations
        
        // Example: Generate a combination name
        print(`hiiii ${data.elementType}, ${data.collisionPartner}`);
        const combinationName = await this.generateCombinationName(data.elementType, data.collisionPartner);
        print(`✨ Suggested combination: ${combinationName}`);
        
        // Example: Update button states or UI
        this.updateUIAfterCollision(combinationName);
        
        // Reset collision processing flag after a delay
        setTimeout(() => {
          this.collisionProcessing = false;
        }, 1000); // 1 second delay to prevent rapid collisions
        
        // Optional: Create a new combined object after a delay
        // this.createCombinedObject(combinationName, data.elementType, data.collisionPartner);
      } else {
        print(`⚠️ Collision already being processed, skipping duplicate`);
      }
    } else {
      print(`   Deleted without collision`);
    }
  }

  /**
   * Creates a new combined object after collision (optional)
   */
  private createCombinedObject(combinationName: string, element1: string, element2: string) {
    if (!this.snap3DFactory) {
      print(`❌ Cannot create combined object - no factory available`);
      return;
    }

    // Add a delay to ensure the original objects are fully destroyed
    setTimeout(() => {
      print(`🎨 Creating combined object: ${combinationName}`);
      this.snap3DFactory.createInteractable3DObject(combinationName)
        .then((result) => {
          print(`✅ Created combined object: ${result.status}`);
        })
        .catch((error) => {
          print(`❌ Failed to create combined object: ${error}`);
        });
    }, 200); // 200ms delay to ensure cleanup is complete
  }

  /**
   * Generates a creative combination name (you can replace this with LLM call)
   */
private async generateCombinationName(element1: string, element2: string): Promise<string> {
  try {
    const merged = await mergeTitles(element1, element2);
    print(`Merged title: ${merged}`);
    return merged;
  } catch (err) {
    print("Error merging titles: " + err);
    return "Error";
  }
}

  /**
   * Updates UI after collision (customize this for your needs)
   */
  private updateUIAfterCollision(element: string) {
    // Add a delay to ensure the previous objects are fully destroyed
    setTimeout(() => {
      if (!this.snap3DFactory) {
        print(`❌ Cannot create ${element} - no factory available`);
        return;
      }

      // Check if factory is available before creating object
      if (!(this.snap3DFactory as any).avaliableToRequest) {
        print(`⏳ Factory is busy, skipping ${element} creation`);
        return;
      }

      print(`🎨 Creating combined object after collision: ${element}`);
      this.snap3DFactory.createInteractable3DObject(element)
        .then((result) => {
          print(`✅ ${element} element created successfully: ${result.status}`);
          print(`📝 Object tracked by factory: ${result.sceneObject.name}`);
          
          // Add the new combination to the element list and create a button for it
          this.addNewCombinationToSidebar(element);
        })
        .catch((error) => {
          print(`❌ Failed to create ${element} element: ${error}`);
          print(`💡 This might be due to:`);
          print(`   - Missing or invalid Snap3D API key`);
          print(`   - Snap3D service unavailable`);
          print(`   - Rate limiting (too many requests)`);
          print(`   - Invalid prompt format`);
          
          // Reset availability flag on error
          (this.snap3DFactory as any).avaliableToRequest = true;
        });
    }, 500); // Increased delay to 500ms to ensure cleanup is complete
  }

  /**
   * Adds a new combination to the element list and creates a button for it
   */
  private addNewCombinationToSidebar(combinationName: string) {
    // Check if this combination already exists in the list
    if (this.elementList.includes(combinationName)) {
      print(`⚠️ Combination "${combinationName}" already exists in element list`);
      return;
    }

    print(`🆕 Adding new combination to sidebar: ${combinationName}`);
    
    // Add to element list
    this.elementList.push(combinationName);
    
    // Create a new button for this combination
    const newButtonIndex = this.elementList.length - 1;
    this.createElementButton(combinationName, newButtonIndex);
    
    // Reposition all buttons to accommodate the new one
    this.repositionButtons();
    
    print(`✅ Added "${combinationName}" to element list (total: ${this.elementList.length})`);
    print(`📋 Current element list: ${JSON.stringify(this.elementList)}`);
  }

  /**
   * Removes a combination from the element list and its button
   */
  public removeCombination(combinationName: string) {
    const index = this.elementList.indexOf(combinationName);
    if (index > -1) {
      this.elementList.splice(index, 1);
      
      // Find and destroy the corresponding button
      const buttonToRemove = this.generatedButtons.find(btn => btn.name === `ElementButton_${combinationName}`);
      if (buttonToRemove) {
        buttonToRemove.destroy();
        this.generatedButtons = this.generatedButtons.filter(btn => btn !== buttonToRemove);
      }
      
      // Reposition remaining buttons
      this.repositionButtons();
      print(`✅ Removed combination "${combinationName}" from element list`);
    } else {
      print(`⚠️ Combination "${combinationName}" not found in element list`);
    }
  }

  /**
   * Clears all combinations (keeps only original elements)
   */
  public clearAllCombinations() {
    const originalElements = ["fire", "water", "earth", "wind"];
    const combinationsToRemove: string[] = [];
    
    // Find all non-original elements
    this.elementList.forEach(element => {
      if (!originalElements.includes(element)) {
        combinationsToRemove.push(element);
      }
    });
    
    // Remove each combination
    combinationsToRemove.forEach(combination => {
      this.removeCombination(combination);
    });
    
    print(`✅ Cleared ${combinationsToRemove.length} combinations, kept ${originalElements.length} original elements`);
  }

  /**
   * Gets only the combinations (excludes original elements)
   */
  public getCombinations(): string[] {
    const originalElements = ["fire", "water", "earth", "wind"];
    return this.elementList.filter(element => !originalElements.includes(element));
  }

  /**
   * Gets only the original elements
   */
  public getOriginalElements(): string[] {
    const originalElements = ["fire", "water", "earth", "wind"];
    return this.elementList.filter(element => originalElements.includes(element));
  }
}
