import Vector3, {SparseVector3} from "@/Engine/views/common/Vector3";

export default interface IView {
	add(view:IView): this;
	remove(object:IView): this;
	getPosition():Vector3;
	setPosition(position:Vector3|SparseVector3):void;
	getScale():Vector3;
	setScale(scale:Vector3|SparseVector3):void;
	isVisible():boolean;
	setVisible(visible:boolean):void;
	setName(name:string):void;
}
export const IViewSymbol = Symbol.for("IView");
