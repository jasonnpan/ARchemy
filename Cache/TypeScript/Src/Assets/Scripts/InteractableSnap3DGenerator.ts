import { ASRQueryController } from "./ASRQueryController";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class InteractableSnap3DGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Example of using generative 3D with Snap3D")
  @input
  snap3DFactory: Snap3DInteractableFactory;
  @ui.separator
  // @input
  // private asrQueryController: ASRQueryController;
  // @input
  // private targetPosition: SceneObject;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.generateObjects();
    //   this.asrQueryController.onQueryEvent.add((query) => {
    //     this.snap3DFactory.createInteractable3DObject(
    //       query,
    //       this.targetPosition.getTransform().getWorldPosition()
    //     );
    //   });
    });
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
