import { ASRQueryController } from "./ASRQueryController";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";

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
    "earth",
    "wind",
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

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.setupElementButtons();
    });
  }

  onUpdate() {
    // Sync the max3DObjects setting with the factory
    if (this.snap3DFactory && this.max3DObjects !== this.snap3DFactory.getObjectCount()) {
      this.snap3DFactory.setMaxObjects(this.max3DObjects);
    }
  }

  private setupElementButtons() {
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
  }

  private createButtonsFromPrefab() {
    print("🔧 Creating buttons from prefab...");
    
    // Clear existing buttons
    this.generatedButtons.forEach(button => button.destroy());
    this.generatedButtons = [];

    // Create a button for each element
    this.elementList.forEach((element, index) => {
      this.createElementButton(element, index);
    });

    print(`✅ Created ${this.elementList.length} dynamic buttons from prefab`);
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
    print(`📝 Element ${index + 1}: ${element}`);
    print(`   - Create a scene object named "ElementButton_${element}"`);
    print(`   - Add PinchButton component`);
    print(`   - Add Interactable component (required for PinchButton)`);
    print(`   - Position at Y offset: ${(this.elementList.length - 1 - index) * this.buttonSpacing - (this.elementList.length - 1) * this.buttonSpacing / 2}`);
    print(`   - Connect to generateElement("${element}") function`);
  }

  private createElementButton(element: string, index: number) {
    if (!this.elementButtonPrefab) {
      print(`❌ Cannot create button for ${element}: No prefab assigned`);
      return;
    }

    try {
      // Create button object using standard prefab instantiation
      const buttonObject = this.elementButtonPrefab.instantiate(this.sceneObject);
      buttonObject.name = `ElementButton_${element}`;
      
      // Position the button - simple vertical spacing
      const yOffset = -index * 10.0;
      buttonObject.getTransform().setLocalPosition(new vec3(0, yOffset, 0));
      print(`📍 Positioned ${element} button at Y: ${yOffset}`);

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
      const yOffset = (this.elementList.length - 1 - index) * this.buttonSpacing - (this.elementList.length - 1) * this.buttonSpacing / 2;
      button.getTransform().setLocalPosition(new vec3(0, yOffset, 0));
    });
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
    print("✅ Cleared all element buttons");
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
}
