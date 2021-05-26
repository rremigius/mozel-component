import ThreeObject from "@/Engine/views/threejs/ThreeObject";
import CameraModel from "@/Engine/models/ObjectModel/CameraModel";
import {Camera} from "three";
import {root} from "@/Engine/views/threejs/ThreeView";

const RootCamera = root(Camera);
export default class ThreeCamera extends ThreeObject {
	static Model = CameraModel;
	model!:CameraModel;

	get camera() { return <Camera><unknown>this.object3D; }
	createObject3D() {
		return new RootCamera();
	}

	public setAspectRatio(ratio: number): void {
		// this camera does not do that
	}
}
