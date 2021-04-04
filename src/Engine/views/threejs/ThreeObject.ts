import {Object3D, Vector3} from "three";
import threeContainer from "@/Engine/views/threejs/dependencies";
import {default as V3, SparseVector3} from "@/Engine/views/common/Vector3";
import IView, {IObjectViewSymbol} from "@/Engine/views/common/IObjectView";
import {injectable} from "@/Engine/views/dependencies";

function applySparseVector(target:Vector3, source:SparseVector3) {
	if(source.x !== undefined) {
		target.x = source.x;
	}
	if(source.y !== undefined) {
		target.y = source.y;
	}
	if(source.z !== undefined) {
		target.z = source.z;
	}
}

@injectable(threeContainer, IObjectViewSymbol)
export default class ThreeObject implements IView {
	readonly object3D:Object3D;

	constructor() {
		this.object3D = this.createObject3D();
	}

	protected createObject3D(): Object3D {
		return new Object3D();
	}

	public getObject3D() {
		return this.object3D;
	}
	add(object: ThreeObject) {
		this.object3D.add(object.getObject3D());
		return this;
	}
	remove(object: ThreeObject) {
		this.object3D.remove(object.getObject3D());
		return this;
	}
	getPosition() {
		return this.object3D.position;
	}
	getScale() {
		return this.object3D.scale;
	}
	setPosition(position: V3|SparseVector3) {
		if(position instanceof V3) {
			this.object3D.position.set(position.x, position.y, position.z);
			return;
		}
		applySparseVector(this.object3D.position, position);
	}
	setScale(scale: V3) {
		this.object3D.scale.set(scale.x, scale.y, scale.z);
		applySparseVector(this.object3D.scale, scale);
	}
	isVisible() {
		return this.object3D.visible;
	}
	setVisible(visible:boolean) {
		this.object3D.visible = visible;
	}
	setName(name:string) {
		this.object3D.name = name;
	}
}