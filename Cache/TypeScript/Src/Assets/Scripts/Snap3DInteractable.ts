import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
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
    
    // Set up collision detection
    this.setupCollisionDetection();
  }

  private setupCollisionDetection() {
    if (this.hasSetupCollision) return;
    
    // Try to get BodyComponent first (preferred for collision detection)
    const bodyComponent = this.colliderObj.getComponent("Physics.BodyComponent");
    if (bodyComponent) {
      print(`Setting up collision detection (BodyComponent) for: ${this.promptDisplay.text || "unknown"}`);
      bodyComponent.onCollisionEnter.add((e) => {
        print(`Collision detected!`);
        const collision = e.collision;
        const otherObject = collision.collider.sceneObject;
        const otherSnap3D = otherObject.getComponent(Snap3DInteractable.getTypeName());
        if (otherSnap3D) {
          print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
        } else {
          print(`Collision with non-Snap3D object: ${otherObject.name}`);
        }
      });
      this.hasSetupCollision = true;
    } else {
      // Fallback to ColliderComponent if no BodyComponent
      const collider = this.colliderObj.getComponent("Physics.ColliderComponent");
      if (collider) {
        print(`Setting up collision detection (ColliderComponent) for: ${this.promptDisplay.text || "unknown"}`);
        collider.onOverlapEnter.add((eventArgs) => {
          print(`Overlap detected!`);
          if (eventArgs && eventArgs.overlap) {
            const otherCollider = eventArgs.overlap.collider;
            if (otherCollider) {
              const otherObject = otherCollider.sceneObject;
              const otherSnap3D = otherObject.getComponent(Snap3DInteractable.getTypeName());
              if (otherSnap3D) {
                print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
              } else {
                print(`Collision with non-Snap3D object: ${otherObject.name}`);
              }
            }
          }
        });
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
        this.setupCollisionDetection();
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
}
