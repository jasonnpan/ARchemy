"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Snap3DInteractable_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snap3DInteractable = void 0;
var __selfType = requireType("./Snap3DInteractable");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const FunctionTimingUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils");
let Snap3DInteractable = Snap3DInteractable_1 = class Snap3DInteractable extends BaseScriptComponent {
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
        (0, FunctionTimingUtils_1.setTimeout)(() => {
            this.setupCollisionDetection();
        }, 100); // 100ms delay
    }
    setupCollisionDetection() {
        if (this.hasSetupCollision)
            return;
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
                let otherSnap3D = otherObject.getComponent(Snap3DInteractable_1.getTypeName());
                // If not found, try to find it on the parent object (in case we're colliding with a child)
                if (!otherSnap3D) {
                    const parentObject = otherObject.getParent();
                    if (parentObject) {
                        otherSnap3D = parentObject.getComponent(Snap3DInteractable_1.getTypeName());
                        // print(`Checking parent object: ${parentObject.name}`);
                    }
                }
                // If still not found, try to find it by searching up the hierarchy
                if (!otherSnap3D) {
                    let currentObject = otherObject;
                    while (currentObject && !otherSnap3D) {
                        otherSnap3D = currentObject.getComponent(Snap3DInteractable_1.getTypeName());
                        if (!otherSnap3D) {
                            currentObject = currentObject.getParent();
                        }
                    }
                }
                if (otherSnap3D) {
                    print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
                    // Delete both objects on collision
                    this.deleteOnCollision();
                    otherSnap3D.deleteOnCollision();
                }
                else {
                    // print(`Collision with non-Snap3D object: ${otherObject.name}`);
                    // Still delete this object when colliding with non-Snap3D objects
                    this.deleteOnCollision();
                }
            });
            this.hasSetupCollision = true;
        }
        else {
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
                            let otherSnap3D = otherObject.getComponent(Snap3DInteractable_1.getTypeName());
                            // If not found, try to find it on the parent object (in case we're colliding with a child)
                            if (!otherSnap3D) {
                                const parentObject = otherObject.getParent();
                                if (parentObject) {
                                    otherSnap3D = parentObject.getComponent(Snap3DInteractable_1.getTypeName());
                                    // print(`Checking parent object: ${parentObject.name}`);
                                }
                            }
                            // If still not found, try to find it by searching up the hierarchy
                            if (!otherSnap3D) {
                                let currentObject = otherObject;
                                while (currentObject && !otherSnap3D) {
                                    otherSnap3D = currentObject.getComponent(Snap3DInteractable_1.getTypeName());
                                    if (!otherSnap3D) {
                                        currentObject = currentObject.getParent();
                                    }
                                }
                            }
                            if (otherSnap3D) {
                                print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
                                // Delete both objects on collision
                                this.deleteOnCollision();
                                otherSnap3D.deleteOnCollision();
                            }
                            else {
                                // print(`Collision with non-Snap3D object: ${otherObject.name}`);
                                // Still delete this object when colliding with non-Snap3D objects
                                this.deleteOnCollision();
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
                        let otherSnap3D = otherObject.getComponent(Snap3DInteractable_1.getTypeName());
                        // If not found, try to find it on the parent object (in case we're colliding with a child)
                        if (!otherSnap3D) {
                            const parentObject = otherObject.getParent();
                            if (parentObject) {
                                otherSnap3D = parentObject.getComponent(Snap3DInteractable_1.getTypeName());
                                // print(`Checking parent object: ${parentObject.name}`);
                            }
                        }
                        // If still not found, try to find it by searching up the hierarchy
                        if (!otherSnap3D) {
                            let currentObject = otherObject;
                            while (currentObject && !otherSnap3D) {
                                otherSnap3D = currentObject.getComponent(Snap3DInteractable_1.getTypeName());
                                if (!otherSnap3D) {
                                    currentObject = currentObject.getParent();
                                }
                            }
                        }
                        if (otherSnap3D) {
                            print(`COLLISION! ${this.promptDisplay.text} hit ${otherSnap3D.promptDisplay.text}`);
                            // Delete both objects on collision
                            this.deleteOnCollision();
                            otherSnap3D.deleteOnCollision();
                        }
                        else {
                            // print(`Collision with non-Snap3D object: ${otherObject.name}`);
                            // Still delete this object when colliding with non-Snap3D objects
                            this.deleteOnCollision();
                        }
                    });
                }
                this.hasSetupCollision = true;
            }
            else {
                print(`WARNING: No physics components found on ${this.colliderObj.name}`);
            }
        }
    }
    setPrompt(prompt) {
        this.promptDisplay.text = prompt;
    }
    setImage(image) {
        this.img.enabled = true;
        this.img.mainPass.baseTex = image;
    }
    setModel(model, isFinal) {
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
                (0, FunctionTimingUtils_1.setTimeout)(() => {
                    this.setupCollisionDetection();
                }, 100); // Small delay to ensure model is fully loaded
            }
        }
        else {
            this.tempModel = model.tryInstantiate(this.modelParent, this.mat);
            this.tempModel.getTransform().setLocalScale(this.sizeVec);
        }
    }
    onFailure(error) {
        this.img.enabled = false;
        this.spinner.enabled = false;
        if (this.tempModel) {
            this.tempModel.destroy();
        }
        if (this.finalModel) {
            this.finalModel.destroy();
        }
        this.promptDisplay.text = "Error: " + error;
        (0, FunctionTimingUtils_1.setTimeout)(() => {
            this.destroy();
        }, 5000); // Hide error after 5 seconds
    }
    /**
     * Deletes the object when it collides with another object
     */
    deleteOnCollision() {
        // print(`Deleting object due to collision: ${this.promptDisplay.text}`);
        // Clean up models
        if (this.tempModel) {
            this.tempModel.destroy();
            this.tempModel = null;
        }
        if (this.finalModel) {
            this.finalModel.destroy();
            this.finalModel = null;
        }
        // Disable UI elements
        this.img.enabled = false;
        this.spinner.enabled = false;
        // Destroy the entire scene object
        this.sceneObject.destroy();
    }
    /**
     * Public method to manually trigger collision deletion (for testing)
     */
    triggerCollisionDeletion() {
        // print(`Manually triggering collision deletion for: ${this.promptDisplay.text}`);
        this.deleteOnCollision();
    }
    __initialize() {
        super.__initialize();
        this.tempModel = null;
        this.finalModel = null;
        this.size = 20;
        this.sizeVec = null;
        this.hasSetupCollision = false;
    }
};
exports.Snap3DInteractable = Snap3DInteractable;
exports.Snap3DInteractable = Snap3DInteractable = Snap3DInteractable_1 = __decorate([
    component
], Snap3DInteractable);
//# sourceMappingURL=Snap3DInteractable.js.map