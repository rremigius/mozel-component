import ObjectModel from "@/Engine/models/ObjectModel";
import React from "react";
import UIView, {ReactViewComponentPropsWithStyles, UIViewReact} from "@/Engine/views/ui/UIView";
import {components} from "@/Component";
import {schema} from "mozel";
import SceneModel from "@/Engine/models/SceneModel";
import ComponentList from "@/Component/ComponentList";
import View from "@/View";
import {Theme, withStyles} from "@material-ui/core";
import {ReactViewComponent} from "@/Engine/views/ui/ReactView";

type Props = ReactViewComponentPropsWithStyles<UIObjectView, typeof styles>
type State = {};
export const UIObjectViewReact = withStyles(styles())(
	class UIObjectViewReact extends ReactViewComponent<Props, State> {
		render() {
			return <UIViewReact view={this.view}/>;
		}
	}
)
function styles() {
	return (theme:Theme) => ({

	});
}

export default class UIObjectView extends UIView {
	static Model = ObjectModel;
	model!: ObjectModel;

	// We use UIObjectView as factory type and runtime check, but cannot override parent type because of events
	@components(schema(SceneModel).children, UIObjectView)
	children!:ComponentList<View>;

	getReactComponent(): typeof React.Component {
		return UIObjectViewReact as typeof React.Component;
	}
}
