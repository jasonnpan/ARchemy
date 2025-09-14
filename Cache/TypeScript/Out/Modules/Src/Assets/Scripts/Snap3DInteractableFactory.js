"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snap3DInteractableFactory = void 0;
var __selfType = requireType("./Snap3DInteractableFactory");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const Snap3D_1 = require("Remote Service Gateway.lspkg/HostedSnap/Snap3D");
const Snap3DInteractable_1 = require("./Snap3DInteractable");
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
const CacheAPIService_1 = require("./CacheAPIService");
const FunctionTimingUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils");
let Snap3DInteractableFactory = class Snap3DInteractableFactory extends BaseScriptComponent {
    onAwake() {
        this.createEvent("TapEvent").bind(() => {
            if (!this.runOnTap) {
                return;
            }
            this.createInteractable3DObject(this.prompt);
        });
    }
    createInteractable3DObject(input, overridePosition) {
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
            let outputObj = this.snap3DInteractablePrefab.instantiate(this.sceneObject);
            outputObj.name = "Snap3DInteractable - " + input;
            // Add the object to tracking immediately when created
            this.generatedObjects.push(outputObj);
            print(`📝 Added object to tracking: ${outputObj.name} (Total: ${this.generatedObjects.length})`);
            let snap3DInteractable = outputObj.getComponent(Snap3DInteractable_1.Snap3DInteractable.getTypeName());
            snap3DInteractable.setPrompt(input);
            // Set up event listener for object deletion
            if (this.generator) {
                this.generator.subscribeToCollisionEvents(snap3DInteractable);
            }
            else {
                print(`⚠️ No generator assigned - collision events will not be forwarded`);
            }
            if (overridePosition) {
                outputObj.getTransform().setWorldPosition(overridePosition);
            }
            else {
                let newPos = this.wcfmp.getForwardPosition(80);
                outputObj.getTransform().setWorldPosition(newPos);
            }
            // Add a flag to prevent multiple executions
            let hasResolved = false;
            const safeResolve = (result) => {
                if (!hasResolved) {
                    hasResolved = true;
                    resolve(result);
                }
            };
            const safeReject = (error) => {
                if (!hasResolved) {
                    hasResolved = true;
                    reject(error);
                }
            };
            // Check cache first, then proceed with generation if not found
            this.cacheAPIService.queryAsset(input)
                .then((result) => {
                var _a, _b;
                if (hasResolved)
                    return; // Prevent race condition
                if (result.found) {
                    print(`🔍 Asset found in cache: ${(_a = result.data) === null || _a === void 0 ? void 0 : _a.word_c}`);
                    this.loadGltfFromUrl(CacheAPIService_1.cacheAPIUrl + "/download/" + ((_b = result.data) === null || _b === void 0 ? void 0 : _b.word_c), snap3DInteractable, safeResolve, safeReject);
                }
                else {
                    print(`🔍 Asset not yet in cache: ${input}`);
                    // Continue with Snap3D generation since not found in cache
                    this.generateWithSnap3D(input, snap3DInteractable, outputObj, safeResolve, safeReject);
                }
            })
                .catch((error) => {
                if (hasResolved)
                    return; // Prevent race condition
                print(`❌ Failed to query asset from cache: ${error}`);
                // Continue with Snap3D generation on cache error
                this.generateWithSnap3D(input, snap3DInteractable, outputObj, safeResolve, safeReject);
            });
        });
    }
    manageObjectLimit() {
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
    cleanupDestroyedObjects() {
        const beforeCount = this.generatedObjects.length;
        this.generatedObjects = this.generatedObjects.filter(obj => {
            // Check if the object still exists and is not destroyed
            try {
                // Try to access a property to see if the object is still valid
                const name = obj.name;
                return name !== null && name !== undefined;
            }
            catch (e) {
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
    setMaxObjects(max) {
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
    clearAllObjects() {
        print(`🗑️ Clearing all ${this.generatedObjects.length} 3D objects...`);
        this.generatedObjects.forEach(obj => {
            obj.destroy();
        });
        this.generatedObjects = [];
        print(`✅ Cleared all 3D objects`);
    }
    getObjectCount() {
        return this.generatedObjects.length;
    }
    getObjects() {
        return [...this.generatedObjects];
    }
    cleanupDestroyedObjectsPublic() {
        this.cleanupDestroyedObjects();
    }
    getObjectStatus() {
        this.cleanupDestroyedObjects();
        print(`📊 Object Status: ${this.generatedObjects.length}/${this.maxObjects} objects tracked`);
        print(`🔧 Factory available: ${this.avaliableToRequest}`);
        this.generatedObjects.forEach((obj, index) => {
            try {
                print(`   ${index + 1}. ${obj.name} (valid)`);
            }
            catch (e) {
                print(`   ${index + 1}. [DESTROYED] (invalid)`);
            }
        });
    }
    forceResetFactory() {
        print(`🔄 Force resetting factory state...`);
        this.cleanupDestroyedObjects();
        this.avaliableToRequest = true;
        print(`✅ Factory reset complete. Available: ${this.avaliableToRequest}, Objects: ${this.generatedObjects.length}`);
    }
    onTap() { }
    /**
     * Load a GLB file from a URL and set it as the model
     */
    loadGltfFromUrl(url, snap3DInteractable, resolve, reject) {
        const rsm = require("LensStudio:RemoteServiceModule");
        const rmm = require("LensStudio:RemoteMediaModule");
        print(`🔄 Loading GLB from URL: ${url}`);
        // Add timeout to prevent infinite hanging
        const timeoutId = (0, FunctionTimingUtils_1.setTimeout)(() => {
            print(`⏰ Timeout loading GLB from URL: ${url}`);
            this.avaliableToRequest = true;
            snap3DInteractable.onFailure(`Timeout loading model from URL: ${url}`);
            const index = this.generatedObjects.indexOf(snap3DInteractable.sceneObject);
            if (index > -1) {
                this.generatedObjects.splice(index, 1);
                print(`🗑️ Removed failed object from tracking: ${snap3DInteractable.sceneObject.name}`);
            }
            reject(`Timeout loading GLB from URL: ${url}`);
        }, 15000); // 15 second timeout
        try {
            const resource = rsm.makeResourceFromUrl(url);
            print(`✅ Resource created successfully from URL: ${url}`);
            rmm.loadResourceAsGltfAsset(resource, (gltfAsset) => {
                (0, FunctionTimingUtils_1.clearTimeout)(timeoutId);
                print(`✅ Successfully loaded GLB from URL: ${url}`);
                snap3DInteractable.setModel(gltfAsset, true);
                this.avaliableToRequest = true;
                resolve({
                    status: "Successfully loaded GLB from URL: " + url,
                    sceneObject: snap3DInteractable.sceneObject
                });
            }, () => {
                (0, FunctionTimingUtils_1.clearTimeout)(timeoutId);
                print(`❌ Failed to load GLB from URL: ${url}`);
                this.avaliableToRequest = true;
                snap3DInteractable.onFailure(`Failed to load model from URL: ${url}`);
                const index = this.generatedObjects.indexOf(snap3DInteractable.sceneObject);
                if (index > -1) {
                    this.generatedObjects.splice(index, 1);
                    print(`🗑️ Removed failed object from tracking: ${snap3DInteractable.sceneObject.name}`);
                }
                reject(`Failed to load GLB from URL: ${url}`);
            });
        }
        catch (error) {
            (0, FunctionTimingUtils_1.clearTimeout)(timeoutId);
            print(`❌ Error creating resource from URL: ${url}, Error: ${error}`);
            this.avaliableToRequest = true;
            snap3DInteractable.onFailure(`Error creating resource from URL: ${url}`);
            const index = this.generatedObjects.indexOf(snap3DInteractable.sceneObject);
            if (index > -1) {
                this.generatedObjects.splice(index, 1);
                print(`🗑️ Removed failed object from tracking: ${snap3DInteractable.sceneObject.name}`);
            }
            reject(`Error creating resource from URL: ${url}`);
        }
    }
    generateWithSnap3D(input, snap3DInteractable, outputObj, resolve, reject) {
        print(`🔄 Submitting task to Snap3D`);
        Snap3D_1.Snap3D.submitAndGetStatus({
            prompt: input,
            format: "glb",
            refine: this.refineMesh,
            use_vertex_color: this.useVertexColor,
        })
            .then((submitGetStatusResults) => {
            submitGetStatusResults.event.add(([value, assetOrError]) => {
                if (value === "image") {
                    assetOrError = assetOrError;
                    print(assetOrError.url);
                    snap3DInteractable.setImage(assetOrError.texture);
                }
                else if (value === "base_mesh") {
                    assetOrError = assetOrError;
                    print(assetOrError.url);
                    if (!this.refineMesh) {
                        snap3DInteractable.setModel(assetOrError.gltfAsset, true);
                        this.cacheAPIService.updateAsset(input, assetOrError.url);
                        print(`🔍 Updated asset in cache: ${input}`);
                        this.avaliableToRequest = true;
                        resolve({
                            status: "Successfully created mesh with prompt: " + input,
                            sceneObject: outputObj
                        });
                    }
                    else {
                        snap3DInteractable.setModel(assetOrError.gltfAsset, false);
                    }
                }
                else if (value === "refined_mesh") {
                    assetOrError = assetOrError;
                    print(assetOrError.url);
                    snap3DInteractable.setModel(assetOrError.gltfAsset, true);
                    this.cacheAPIService.updateAsset(input, assetOrError.url);
                    print(`🔍 Updated asset in cache: ${input}`);
                    this.avaliableToRequest = true;
                    resolve({
                        status: "Successfully created mesh with prompt: " + input,
                        sceneObject: outputObj
                    });
                }
                else if (value === "failed") {
                    assetOrError = assetOrError;
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
    }
    __initialize() {
        super.__initialize();
        this.avaliableToRequest = true;
        this.wcfmp = WorldCameraFinderProvider_1.default.getInstance();
        this.generatedObjects = [];
        this.maxObjects = 2;
        this.cacheAPIService = CacheAPIService_1.CacheAPIService.getInstance();
    }
};
exports.Snap3DInteractableFactory = Snap3DInteractableFactory;
exports.Snap3DInteractableFactory = Snap3DInteractableFactory = __decorate([
    component
], Snap3DInteractableFactory);
//# sourceMappingURL=Snap3DInteractableFactory.js.map