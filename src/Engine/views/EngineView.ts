import View from "@/View";
import Engine, {KeyboardEvent} from "@/Engine/Engine";

export default class EngineView extends View {
	_container?:HTMLElement;
	get container() {
		return this._container;
	}

	_engine?:Engine;
	get engine() {
		return this._engine;
	}

	setEngine(engine:Engine) {
		this._engine = engine;
	}

	resize() {
		if(!this.container) return;
		this.setSize(this.container.clientWidth, this.container.clientHeight);
	}

	setSize(width:number, height:number) {

	}

	render() {

	}

	detach() {
		this.onDetach();
	}

	attachTo(container:HTMLElement) {
		this._container = container;
		this.onAttachTo(container);
	}

	onAttachTo(container:HTMLElement) {

	}

	onDetach() {

	}
}
