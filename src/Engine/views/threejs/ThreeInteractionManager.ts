import ThreeCamera from "./ThreeObject/ThreeCamera";
import {Object3D, Raycaster, Vector2} from "three";
import ThreeScene from "./ThreeObject/ThreeScene";
import {injectable} from "@/Engine/views/dependencies";
import threeContainer from "@/Engine/views/threejs/dependencies";
import {ObjectClickEvent} from "@/Engine/views/common/IObjectView/IViewRoot";
import {RootObject3D} from "@/Engine/views/threejs/ThreeObject/ThreeRootObject";

@injectable(threeContainer, IInteractionManagerSymbol)
export default class ThreeInteractionManager {
	protected mouse = new Vector2();
	protected raycaster = new Raycaster();
	public camera?: ThreeCamera;
	public scene?: ThreeScene;

	protected readonly _handleMouseMove: (e: MouseEvent) => void;
	protected readonly _handleClick: (e: MouseEvent) => void;

	constructor() {
		this._handleMouseMove = this.handleMouseMove.bind(this);
		window.addEventListener('mousemove', (e) => { this._handleMouseMove(e);} );
		this._handleClick = this.handleClick.bind(this);
		window.addEventListener('click', (e) => { this._handleClick(e);} );
	}

	destroy() {
		window.removeEventListener('mousemove', this._handleMouseMove);
		window.removeEventListener('click', this._handleClick);
	}

	protected handleMouseMove(event: MouseEvent) {
		this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}

	protected handleClick(event: MouseEvent) {
		if(!this.camera || !this.scene) return;

		const camera = this.camera.getObject3D();
		const scene = this.scene.getObject3D();

		this.raycaster.setFromCamera(this.mouse, camera);

		// calculate objects intersecting the picking ray
		const intersects = this.raycaster.intersectObjects( scene.children, true);
		if (!intersects.length) {
			return;
		}

		const root = findRoot(intersects[0].object);
		if (!root) {
			return;
		}
		const meshes = intersects.map((i) => i.object);
		root.onClick(new ObjectClickEvent(meshes));
	}
}

/** Given an Object3d (most likely a Mesh), finds the ThreeRootObject it lies under */
const findRoot = (object: Object3D): RootObject3D | null => {
	let currentObject = object;
	while (currentObject != null) {
		if(currentObject instanceof RootObject3D){
			return currentObject;
		}
		currentObject = currentObject.parent!;
	}
	return null;
};
