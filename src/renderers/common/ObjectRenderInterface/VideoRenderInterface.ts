import ObjectRenderInterface from "@/renderers/common/ObjectRenderInterface";
import VideoModel from "@common/models/Object3DModel/VideoModel";

export function createVideo(url:string) {
	const video = document.createElement("video");
	const source = document.createElement("source");
	source.src = url;
	source.type = 'video/mp4';
	video.appendChild(source);
	document.body.appendChild(video);
	video.load();

	return video;
}

export default interface VideoRenderInterface<T> extends ObjectRenderInterface<T> {
	load(xrVideo: VideoModel):Promise<this>;
	play():void;
	pause():void;
	stop():void;
}
