import BehaviourController from "@/Controller/BehaviourController";
import {ControllerAction, ControllerActions, ControllerEvent, injectable} from "@/Controller";
import Log from "@/log";
// import {Howl } from 'howler';

import SoundBehaviourModel from "@/models/BehaviourModel/SoundBehaviourModel";

const log = Log.instance("object/behaviour/Sound");
export class PlayAction extends ControllerAction<void> {}
export class PlayActions extends ControllerActions {
	play = this.$action(PlayAction);
}

@injectable()
export default class SoundBehaviourController extends BehaviourController {
	static ModelClass = SoundBehaviourModel;

	log = log;
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
