import {assert} from 'chai';

import ConditionModel from "@/models/ConditionModel";
import {MozelFactory} from "mozel";
import ConditionEqualsModel from "@/models/ConditionModel/ConditionEqualsModel";
import {ControllerEvent} from "@/Controller";

describe("ConditionEqualsModel", () => {
	it('compares all keys and values in `check` property on equality.', ()=>{
		const factory = new MozelFactory();

		class FooEvent extends ControllerEvent<{foo?:string, bar?:number}> {}

		const condition = factory.create<ConditionEqualsModel<FooEvent>>(ConditionEqualsModel, {
			check: { // type-checked
				foo: 'abc',
				bar: 123
			}
		});

		assert.equal(condition.eval({foo: 'abc', bar:123}), true, "Evaluated matching data as `true`");
		assert.equal(condition.eval({foo: 'cde', bar:123}), false, "Data with one property wrong evald as `false`.");
		assert.equal(condition.eval({}), false, "Empty data evaluated as `false`.");
	});
});