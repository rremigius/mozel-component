import GraphModel from "@/Engine/models/ObjectModel/GraphModel";
import ObjectController from "@/Engine/controllers/ObjectController";

export default class GraphController extends ObjectController {
	static ModelClass = GraphModel;
	model!:GraphModel;
}