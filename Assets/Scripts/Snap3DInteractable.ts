import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";

@component
export class Snap3DInteractable extends BaseScriptComponent {
  @input
  private modelParent: SceneObject;
  @input
  private img: Image;
  @input
  private promptDisplay: Text;
  @input
  private spinner: SceneObject;
  @input
  private mat: Material;
  @input
  private displayPlate: SceneObject;
  @input
  private colliderObj: SceneObject;
  private tempModel: SceneObject = null;
  private finalModel: SceneObject = null;
  private size: number = 20;
  private sizeVec: vec3 = null;
  private hasSetupCollision: boolean = false;
  private isBeingDeleted: boolean = false; // Prevent multiple collision events
  
  // Event that gets triggered when an object is deleted due to collision
  public onObjectDeleted: Event<{objectName: string, elementType: string, collisionPartner?: string}> = new Event();

  onAwake() {
    // Clone the image material to avoid modifying the original
    let imgMaterial = this.img.mainMaterial;
    imgMaterial.mainPass.baseTex = this.img.mainPass.baseTex;
    this.img.enabled = false;

    let offsetBelow = 0;
    this.sizeVec = vec3.one().uniformScale(this.size);
    this.displayPlate
      .getTransform()
      .setLocalPosition(new vec3(0, -this.size * 0.5 - offsetBelow, 0));
    this.colliderObj.getTransform().setLocalScale(this.sizeVec);
    this.img.getTransform().setLocalScale(this.sizeVec);
    
    // Debug: Check what physics components are available (commented out to reduce noise)
    // const bodyComponent = this.colliderObj.getComponent("Physics.BodyComponent");
    // const colliderComponent = this.colliderObj.getComponent("Physics.ColliderComponent");
    // print(`Physics setup for ${this.promptDisplay.text || "unknown"}: BodyComponent=${!!bodyComponent}, ColliderComponent=${!!colliderComponent}`);
    
    // Set up collision detection with a small delay to prevent immediate collisions during creation
    setTimeout(() => {
      this.setupCollisionDetection();
    }, 100); // 100ms delay
  }

  private setupCollisionDetection() {
    if (this.hasSetupCollision) return;
    
    // Try to get BodyComponent first (preferred for collision detection)
    const bodyComponent = this.colliderObj.getComponent("Physics.BodyComponent");
    if (bodyComponent) {
      // print(`Setting up collision detection (BodyComponent) for: ${this.promptDisplay.text || "unknown"}`);
      bodyComponent.onCollisionEnter.add((e) => {
        // print(`Collision detected!`);
        const collision = e.collision;
        const otherObject = collision.collider.sceneObject;
        // print(`Collision with object: ${otherObject.name}`);
        
        // First try to find Snap3D component on the collided object
        let otherSnap3D = otherObject.getComponent(Snap3DInteractable.getTypeName());
        
        // If not found, try to find it on the parent object (in case we're colliding with a child)
        if (!otherSnap3D) {
          const parentObject = otherObject.getParent();
          if (parentObject) {
            otherSnap3D = parentObject.getComponent(Snap3DInteractable.getTypeName());
            // print(`Checking parent object: ${parentObject.name}`);
          }
        }
        
        // If still not found, try to find it by searching up the hierarchy
        if (!otherSnap3D) {
          let currentObject = otherObject;
          while (currentObject && !otherSnap3D) {
            otherSnap3D = currentObject.getComponent(Snap3DInteractable.getTypeName());
            if (!otherSnap3D) {
              currentObject = currentObject.getParent();
            }
          }
        }
        
        if (otherSnap3D) {
          print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
          // Only process collision if neither object is already being deleted
          if (!this.isBeingDeleted && !otherSnap3D.isBeingDeleted) {
            this.isBeingDeleted = true;
            otherSnap3D.isBeingDeleted = true;
            // Delete both objects on collision
            this.deleteOnCollision(otherSnap3D.promptDisplay.text);
            otherSnap3D.deleteOnCollision(this.promptDisplay.text);
          }
        } else {
          // print(`Collision with non-Snap3D object: ${otherObject.name}`);
          // Still delete this object when colliding with non-Snap3D objects
          if (!this.isBeingDeleted) {
            this.isBeingDeleted = true;
            this.deleteOnCollision();
          }
        }
      });
      this.hasSetupCollision = true;
    } else {
      // Fallback to ColliderComponent if no BodyComponent
      const collider = this.colliderObj.getComponent("Physics.ColliderComponent");
      if (collider) {
        // print(`Setting up collision detection (ColliderComponent) for: ${this.promptDisplay.text || "unknown"}`);
        
        // Set up both overlap events for better detection
        collider.onOverlapEnter.add((eventArgs) => {
          // print(`Overlap detected!`);
          if (eventArgs && eventArgs.overlap) {
            const otherCollider = eventArgs.overlap.collider;
            if (otherCollider) {
              const otherObject = otherCollider.sceneObject;
              // print(`Collision with object: ${otherObject.name}`);
              
              // First try to find Snap3D component on the collided object
              let otherSnap3D = otherObject.getComponent(Snap3DInteractable.getTypeName());
              
              // If not found, try to find it on the parent object (in case we're colliding with a child)
              if (!otherSnap3D) {
                const parentObject = otherObject.getParent();
                if (parentObject) {
                  otherSnap3D = parentObject.getComponent(Snap3DInteractable.getTypeName());
                  // print(`Checking parent object: ${parentObject.name}`);
                }
              }
              
              // If still not found, try to find it by searching up the hierarchy
              if (!otherSnap3D) {
                let currentObject = otherObject;
                while (currentObject && !otherSnap3D) {
                  otherSnap3D = currentObject.getComponent(Snap3DInteractable.getTypeName());
                  if (!otherSnap3D) {
                    currentObject = currentObject.getParent();
                  }
                }
              }
              
              if (otherSnap3D) {
                print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
                // Only process collision if neither object is already being deleted
                if (!this.isBeingDeleted && !otherSnap3D.isBeingDeleted) {
                  this.isBeingDeleted = true;
                  otherSnap3D.isBeingDeleted = true;
                  // Delete both objects on collision
                  this.deleteOnCollision(otherSnap3D.promptDisplay.text);
                  otherSnap3D.deleteOnCollision(this.promptDisplay.text);
                }
              } else {
                // print(`Collision with non-Snap3D object: ${otherObject.name}`);
                // Still delete this object when colliding with non-Snap3D objects
                if (!this.isBeingDeleted) {
                  this.isBeingDeleted = true;
                  this.deleteOnCollision();
                }
              }
            }
          }
        });
        
        // Also try onCollisionEnter for ColliderComponent (some versions support this)
        if (collider.onCollisionEnter) {
          collider.onCollisionEnter.add((e) => {
            // print(`Collision detected via ColliderComponent!`);
            const collision = e.collision;
            const otherObject = collision.collider.sceneObject;
            // print(`Collision with object: ${otherObject.name}`);
            
            // First try to find Snap3D component on the collided object
            let otherSnap3D = otherObject.getComponent(Snap3DInteractable.getTypeName());
            
            // If not found, try to find it on the parent object (in case we're colliding with a child)
            if (!otherSnap3D) {
              const parentObject = otherObject.getParent();
              if (parentObject) {
                otherSnap3D = parentObject.getComponent(Snap3DInteractable.getTypeName());
                // print(`Checking parent object: ${parentObject.name}`);
              }
            }
            
            // If still not found, try to find it by searching up the hierarchy
            if (!otherSnap3D) {
              let currentObject = otherObject;
              while (currentObject && !otherSnap3D) {
                otherSnap3D = currentObject.getComponent(Snap3DInteractable.getTypeName());
                if (!otherSnap3D) {
                  currentObject = currentObject.getParent();
                }
              }
            }
            
            if (otherSnap3D) {
              print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
              // Only process collision if neither object is already being deleted
              if (!this.isBeingDeleted && !otherSnap3D.isBeingDeleted) {
                this.isBeingDeleted = true;
                otherSnap3D.isBeingDeleted = true;
                // Delete both objects on collision
                this.deleteOnCollision(otherSnap3D.promptDisplay.text);
                otherSnap3D.deleteOnCollision(this.promptDisplay.text);
              }
            } else {
              // print(`Collision with non-Snap3D object: ${otherObject.name}`);
              // Still delete this object when colliding with non-Snap3D objects
              if (!this.isBeingDeleted) {
                this.isBeingDeleted = true;
                this.deleteOnCollision();
              }
            }
          });
        }
        
        this.hasSetupCollision = true;
      } else {
        print(`WARNING: No physics components found on ${this.colliderObj.name}`);
      }
    }
  }

  setPrompt(prompt: string) {
    this.promptDisplay.text = prompt;
  }

  setImage(image: Texture) {
    this.img.enabled = true;
    this.img.mainPass.baseTex = image;
  }

  setModel(model: GltfAsset, isFinal: boolean) {
    this.img.enabled = false;
    if (isFinal) {
      if (!isNull(this.finalModel)) {
        this.finalModel.destroy();
      }
      this.spinner.enabled = false;
      this.finalModel = model.tryInstantiate(this.modelParent, this.mat);
      this.finalModel.getTransform().setLocalScale(this.sizeVec);
      
      // Ensure collision detection is active after model is loaded
      if (!this.hasSetupCollision) {
        setTimeout(() => {
          this.setupCollisionDetection();
        }, 100); // Small delay to ensure model is fully loaded
      }
    } else {
      this.tempModel = model.tryInstantiate(this.modelParent, this.mat);
      this.tempModel.getTransform().setLocalScale(this.sizeVec);
    }
  }

  onFailure(error: string) {
    this.img.enabled = false;
    this.spinner.enabled = false;
    if (this.tempModel) {
      this.tempModel.destroy();
    }
    if (this.finalModel) {
      this.finalModel.destroy();
    }
    this.promptDisplay.text = "Error: " + error;
    setTimeout(() => {
      this.destroy();
    }, 5000); // Hide error after 5 seconds
  }

  /**
   * Deletes the object when it collides with another object
   */
  private deleteOnCollision(collisionPartner?: string) {
    const objectName = this.sceneObject ? this.sceneObject.name : "Unknown";
    const elementType = this.promptDisplay ? this.promptDisplay.text : "Unknown";
    
    print(`🗑️ Deleting object due to collision: ${elementType}${collisionPartner ? ` (collided with ${collisionPartner})` : ''}`);
    
    // Clean up models
    if (this.tempModel) {
      this.tempModel.destroy();
      this.tempModel = null;
    }
    if (this.finalModel) {
      this.finalModel.destroy();
      this.finalModel = null;
    }
    
    // Disable UI elements safely
    if (this.img) {
      this.img.enabled = false;
    }
    if (this.spinner) {
      this.spinner.enabled = false;
    }
    
    // Disable the collider object to prevent further interactions
    if (this.colliderObj) {
      this.colliderObj.enabled = false;
    }
    
    // Trigger the event before destroying the object
    this.onObjectDeleted.invoke({
      objectName: objectName,
      elementType: elementType,
      collisionPartner: collisionPartner
    });
    
    // Small delay to let physics system clean up before destroying
    setTimeout(() => {
      if (this.sceneObject) {
        this.sceneObject.destroy();
      }
    }, 50); // 50ms delay
  }

  /**
   * Public method to manually trigger collision deletion (for testing)
   */
  public triggerCollisionDeletion() {
    // print(`Manually triggering collision deletion for: ${this.promptDisplay.text}`);
    this.deleteOnCollision();
  }
}
