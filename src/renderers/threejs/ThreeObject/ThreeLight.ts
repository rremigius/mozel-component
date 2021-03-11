import XRThreeObject from "@/classes/renderers/threejs/XRThreeObject";
import {AmbientLight, Color, Light, Object3D} from "three";
import XRLightRenderInterface from "@/classes/renderers/common/XRObjectRenderInterface/XRLightRenderInterface";
import {injectableXRObjectRender} from "@/classes/renderers/inversify";
import threeContainer from "@/classes/renderers/threejs/inversify";

export enum LightType {
	AMBIENT
}

@injectableXRObjectRender(threeContainer, "XRLightRenderInterface")
export default class ThreeLight extends XRThreeObject implements XRLightRenderInterface<Object3D> {
	light:Light;
	color:number|string;
	lightType:LightType;

	constructor() {
		super();
		this.lightType = LightType.AMBIENT;
		this.color = 0xffffff;
		this.light = this.createLight(this.lightType);
		this.getRenderObject().add(this.light);
	}

	createLight(type:LightType) {
		let light:Light;
		switch(type) {
			case LightType.AMBIENT: light = new AmbientLight(this.color); break;
			default: light = new Light(this.color);
		}
		return light;
	}

	setType(type:LightType) {
		if(type === this.lightType) return false;

		this.lightType = type;

		this.object3D.remove(this.light);
		this.light = this.createLight(this.lightType);
		this.object3D.add(this.light);

		return true;
	}

	setColor(color:number|string) {
		this.light.color = new Color(color);
		return true;
	}
}