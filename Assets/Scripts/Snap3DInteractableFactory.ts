import { Snap3D } from "Remote Service Gateway.lspkg/HostedSnap/Snap3D";
import { Snap3DTypes } from "Remote Service Gateway.lspkg/HostedSnap/Snap3DTypes";
import { Snap3DInteractable } from "./Snap3DInteractable";

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export class Snap3DInteractableFactory extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Submit and Get Status Example")
  @input
  @widget(new TextAreaWidget())
  private prompt: string = "A cute dog wearing a hat";
  @input
  private refineMesh: boolean = true;
  @input
  private useVertexColor: boolean = false;
  @ui.group_end
  @input
  runOnTap: boolean = false;

  @input
  snap3DInteractablePrefab: ObjectPrefab;
  @input
  @allowUndefined
  private generator: any = null; // Reference to InteractableSnap3DGenerator

  private avaliableToRequest: boolean = true;
  private wcfmp = WorldCameraFinderProvider.getInstance();
  private generatedObjects: SceneObject[] = [];
  private maxObjects: number = 2;

  onAwake() {
    this.createEvent("TapEvent").bind(() => {
      if (!this.runOnTap) {
        return;
      }
      this.createInteractable3DObject(this.prompt);
    });
  }

  createInteractable3DObject(
    input: string,
    overridePosition?: vec3
  ): Promise<{ status: string; sceneObject: SceneObject }> {
    return new Promise((resolve, reject) => {
      print(`🎯 Creating 3D object for: ${input}`);
      print(`📊 Before creation - Objects tracked: ${this.generatedObjects.length}/${this.maxObjects}`);
      
      if (!this.avaliableToRequest) {
        print("Already processing a request. Please wait.");
        return;
      }
      this.avaliableToRequest = false;
      
      // Check if we need to remove the oldest object before creating a new one
      this.manageObjectLimit();
      
      print(`📊 After limit check - Objects tracked: ${this.generatedObjects.length}/${this.maxObjects}`);
      
      let outputObj = this.snap3DInteractablePrefab.instantiate(
        this.sceneObject
      );
      outputObj.name = "Snap3DInteractable - " + input;
      
      // Add the object to tracking immediately when created
      this.generatedObjects.push(outputObj);
      print(`📝 Added object to tracking: ${outputObj.name} (Total: ${this.generatedObjects.length})`);
      let snap3DInteractable = outputObj.getComponent(
        Snap3DInteractable.getTypeName()
      );
      snap3DInteractable.setPrompt(input);
      
      // Set up event listener for object deletion
      if (this.generator) {
        this.generator.subscribeToCollisionEvents(snap3DInteractable);
      } else {
        print(`⚠️ No generator assigned - collision events will not be forwarded`);
      }

      if (overridePosition) {
        outputObj.getTransform().setWorldPosition(overridePosition);
      } else {
        let newPos = this.wcfmp.getForwardPosition(80);
        outputObj.getTransform().setWorldPosition(newPos);
      }

      Snap3D.submitAndGetStatus({
        prompt: input,
        format: "glb",
        refine: this.refineMesh,
        use_vertex_color: this.useVertexColor,
      })
        .then((submitGetStatusResults) => {
          submitGetStatusResults.event.add(([value, assetOrError]) => {
            if (value === "image") {
              assetOrError = assetOrError as Snap3DTypes.TextureAssetData;
              snap3DInteractable.setImage(assetOrError.texture);
            } else if (value === "base_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              if (!this.refineMesh) {
                snap3DInteractable.setModel(assetOrError.gltfAsset, true);
                this.avaliableToRequest = true;
                resolve({
                  status: "Successfully created mesh with prompt: " + input,
                  sceneObject: outputObj
                });
              } else {
                snap3DInteractable.setModel(assetOrError.gltfAsset, false);
              }
            } else if (value === "refined_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              snap3DInteractable.setModel(assetOrError.gltfAsset, true);
              this.avaliableToRequest = true;
              resolve({
                status: "Successfully created mesh with prompt: " + input,
                sceneObject: outputObj
              });
            } else if (value === "failed") {
              assetOrError = assetOrError as Snap3DTypes.ErrorData;
              print("Error: " + assetOrError.errorMsg);
              //snap3DInteractable.onFailure(assetOrError.errorMsg);
              this.avaliableToRequest = true;
              
              // Remove the failed object from tracking
              const index = this.generatedObjects.indexOf(outputObj);
              if (index > -1) {
                this.generatedObjects.splice(index, 1);
                print(`🗑️ Removed failed object from tracking: ${outputObj.name}`);
              }
              
              reject("Failed to create mesh with prompt: " + input);
            }
          });
        })
        .catch((error) => {
          snap3DInteractable.onFailure(error);
          print("Error submitting task or getting status: " + error);
          this.avaliableToRequest = true;
          
          // Remove the failed object from tracking
          const index = this.generatedObjects.indexOf(outputObj);
          if (index > -1) {
            this.generatedObjects.splice(index, 1);
            print(`🗑️ Removed failed object from tracking: ${outputObj.name}`);
          }
          
          reject("Failed to create mesh with prompt: " + input);
        });
    });
  }

  private manageObjectLimit() {
    // First, clean up any destroyed objects from our tracking
    this.cleanupDestroyedObjects();
    
    // If we're at the limit, remove the oldest object
    if (this.generatedObjects.length >= this.maxObjects) {
      const oldestObject = this.generatedObjects.shift(); // Remove first (oldest) object
      if (oldestObject) {
        print(`🗑️ Removing oldest 3D object: ${oldestObject.name}`);
        oldestObject.destroy();
        print(`✅ Removed oldest object. Now have ${this.generatedObjects.length} objects`);
      }
    }
  }

  private cleanupDestroyedObjects() {
    const beforeCount = this.generatedObjects.length;
    this.generatedObjects = this.generatedObjects.filter(obj => {
      // Check if the object still exists and is not destroyed
      try {
        // Try to access a property to see if the object is still valid
        const name = obj.name;
        return name !== null && name !== undefined;
      } catch (e) {
        // Object is destroyed, remove from tracking
        print(`🗑️ Cleaning up destroyed object from tracking`);
        return false;
      }
    });
    
    const removedCount = beforeCount - this.generatedObjects.length;
    if (removedCount > 0) {
      print(`🧹 Cleaned up ${removedCount} destroyed objects. Now have ${this.generatedObjects.length} objects`);
      
      // If we cleaned up objects and the factory is busy, reset it
      if (!this.avaliableToRequest) {
        print(`🔄 Factory was busy, resetting availability after cleanup`);
        this.avaliableToRequest = true;
      }
    }
  }

  public setMaxObjects(max: number) {
    this.maxObjects = max;
    print(`🔧 Set max 3D objects to: ${max}`);
    
    // If we're over the new limit, remove excess objects
    while (this.generatedObjects.length > this.maxObjects) {
      const oldestObject = this.generatedObjects.shift();
      if (oldestObject) {
        oldestObject.destroy();
      }
    }
  }

  public clearAllObjects() {
    print(`🗑️ Clearing all ${this.generatedObjects.length} 3D objects...`);
    this.generatedObjects.forEach(obj => {
      obj.destroy();
    });
    this.generatedObjects = [];
    print(`✅ Cleared all 3D objects`);
  }

  public getObjectCount(): number {
    return this.generatedObjects.length;
  }

  public getObjects(): SceneObject[] {
    return [...this.generatedObjects];
  }

  public cleanupDestroyedObjectsPublic() {
    this.cleanupDestroyedObjects();
  }

  public getObjectStatus() {
    this.cleanupDestroyedObjects();
    print(`📊 Object Status: ${this.generatedObjects.length}/${this.maxObjects} objects tracked`);
    print(`🔧 Factory available: ${this.avaliableToRequest}`);
    this.generatedObjects.forEach((obj, index) => {
      try {
        print(`   ${index + 1}. ${obj.name} (valid)`);
      } catch (e) {
        print(`   ${index + 1}. [DESTROYED] (invalid)`);
      }
    });
  }

  public forceResetFactory() {
    print(`🔄 Force resetting factory state...`);
    this.cleanupDestroyedObjects();
    this.avaliableToRequest = true;
    print(`✅ Factory reset complete. Available: ${this.avaliableToRequest}, Objects: ${this.generatedObjects.length}`);
  }

  private onTap() {}
}
