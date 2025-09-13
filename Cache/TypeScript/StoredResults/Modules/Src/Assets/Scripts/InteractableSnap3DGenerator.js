"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractableSnap3DGenerator = void 0;
var __selfType = requireType("./InteractableSnap3DGenerator");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
let InteractableSnap3DGenerator = class InteractableSnap3DGenerator extends BaseScriptComponent {
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
    async generateObjects() {
        try {
            // Get the forward position from the camera
            const wcfmp = WorldCameraFinderProvider_1.default.getInstance();
            const centerPosition = wcfmp.getForwardPosition(100);
            // Create positions side by side (left and right of center)
            const spacing = 10; // Distance between objects
            const leftPosition = centerPosition.add(new vec3(-spacing, 0, 0));
            const rightPosition = centerPosition.add(new vec3(spacing, 0, 0));
            // Generate objects at specific positions
            await this.snap3DFactory.createInteractable3DObject("dog", leftPosition);
            await this.snap3DFactory.createInteractable3DObject("peanut", rightPosition);
        }
        catch (error) {
            print("Error generating objects: " + error);
        }
    }
};
exports.InteractableSnap3DGenerator = InteractableSnap3DGenerator;
exports.InteractableSnap3DGenerator = InteractableSnap3DGenerator = __decorate([
    component
], InteractableSnap3DGenerator);
//# sourceMappingURL=InteractableSnap3DGenerator.js.map