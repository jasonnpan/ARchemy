if (script.onAwake) {
	script.onAwake();
	return;
};
function checkUndefined(property, showIfData){
   for (var i = 0; i < showIfData.length; i++){
       if (showIfData[i][0] && script[showIfData[i][0]] != showIfData[i][1]){
           return;
       }
   }
   if (script[property] == undefined){
      throw new Error('Input ' + property + ' was not provided for the object ' + script.getSceneObject().name);
   }
}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Element Generator with Pinch Buttons"}
// @input AssignableType snap3DFactory
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Element Button Prefab"}
// @input Asset.ObjectPrefab elementButtonPrefab {"hint":"Prefab to instantiate for each button"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Manual Buttons (Fallback)"}
// @input AssignableType_1[] manualButtons = {} {"hint":"Manually created PinchButton components (one for each element, in order)"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Element List"}
// @input string[] elementList = {"fire","water","ground","air","life","science","concept"}
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"Layout Settings"}
// @input float buttonSpacing = 10
// @ui {"widget":"separator"}
// @ui {"widget":"label", "label":"3D Object Management"}
// @input float max3DObjects = 2 {"hint":"Maximum number of 3D objects to keep on screen at once"}
var scriptPrototype = Object.getPrototypeOf(script);
if (!global.BaseScriptComponent){
   function BaseScriptComponent(){}
   global.BaseScriptComponent = BaseScriptComponent;
   global.BaseScriptComponent.prototype = scriptPrototype;
   global.BaseScriptComponent.prototype.__initialize = function(){};
   global.BaseScriptComponent.getTypeName = function(){
       throw new Error("Cannot get type name from the class, not decorated with @component");
   }
}
var Module = require("../../../../Modules/Src/Assets/Scripts/InteractableSnap3DGenerator");
Object.setPrototypeOf(script, Module.InteractableSnap3DGenerator.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("snap3DFactory", []);
    checkUndefined("elementList", []);
    checkUndefined("buttonSpacing", []);
    checkUndefined("max3DObjects", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
