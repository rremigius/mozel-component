import ObjectController from "@/Engine/controllers/ViewController/ObjectController";
import Log from "@/log";
import ImageModel from "@/Engine/models/ObjectModel/ImageModel";
import IImageView, {IImageViewSymbol} from "@/Engine/views/common/IObjectView/IImageView";

const log = Log.instance("Engine/Object/Image");

export default class ImageController extends ObjectController {
	static ModelClass = ImageModel;
	static ViewInterface = IImageViewSymbol;

	model!:ImageModel;
	get view() { return super.view as IImageView }

	log = log;

	async onLoad() {
		await super.onLoad();
		await this.view.load(this.model);
	}
}