import BehaviourController from "@/Engine/controllers/BehaviourController";
import {ComponentAction, ComponentActions} from "@/Component";
import Log from "@/log";
// import {Howl } from 'howler';
import SoundBehaviourModel from "@/Engine/models/BehaviourModel/SoundBehaviourModel";

export class PlayAction extends ComponentAction<void> {}
export class PlayActions extends ComponentActions {
	play = this.$action(PlayAction);
}

export default class SoundBehaviourController extends BehaviourController {
	static ModelClass = SoundBehaviourModel;

	actions = new PlayActions();

	get soundBehaviour() {
		return <SoundBehaviourModel>this.model;
	}

	init(model:SoundBehaviourModel) {
		super.init(model);

		this.actions.play.on(this.play.bind(this));
	}

	play() {
		// if (this.soundBehaviour.file) {
		// 	const sound = new Howl({
		// 		src: [this.soundBehaviour.file.url]
		// 	});
		// 	sound.play();
		// }
	}

}
