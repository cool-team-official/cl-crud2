import { isFunction, isString, cloneDeep, isObject } from "./index";
import { __inst, __plugins, __vue } from "../options";

/**
 * Parse JSX, filter params
 * @param {*} vnode
 * @param {{scope,prop,children}} options
 */
const parse_jsx = (vnode, options = {}) => {
	const { scope, prop, $scopedSlots, children = [] } = options;
	const h = __inst.$createElement;

	if (vnode.name.indexOf("slot-") == 0) {
		let rn = $scopedSlots[vnode.name];

		if (rn) {
			return rn({ scope });
		}
	}

	if (vnode.render) {
		if (!__inst.$root.$options.components[vnode.name]) {
			__vue.component(vnode.name, cloneDeep(vnode));
		}

		// Avoid props prompts { type:null }
		delete vnode.props;
	}

	const keys = [
		"class",
		"style",
		"props",
		"attrs",
		"domProps",
		"on",
		"nativeOn",
		"directives",
		"scopedSlots",
		"slot",
		"key",
		"ref",
		"refInFor"
	];

	// Avoid loop update
	let data = cloneDeep(vnode);

	for (let i in data) {
		if (!keys.includes(i)) {
			delete data[i];
		}
	}

	if (scope) {
		if (!data.attrs) {
			data.attrs = {};
		}

		if (!data.on) {
			data.on = {};
		}

		// Set default value
		data.attrs.value = scope[prop];
		// Add input event
		data.on.input = (val) => {
			__inst.$set(scope, prop, val);
		};
	}

	return h(vnode.name, cloneDeep(data), children);
};

/**
 * Render vNode
 * @param {*} vnode
 * @param {*} options
 */
export function renderNode(vnode, { prop, scope, $scopedSlots }) {
	const h = __inst.$createElement;

	if (!vnode) {
		return null;
	}

	// When slot or tagName
	if (isString(vnode)) {
		return parse_jsx({ name: vnode }, { scope, $scopedSlots });
	}

	// When customeize render function
	if (isFunction(vnode)) {
		return vnode({ scope, h });
	}

	// When jsx
	if (isObject(vnode)) {
		if (vnode.context) {
			return vnode;
		}

		if (vnode.name) {
			// Handle general component
			if (["el-select", "el-radio-group", "el-checkbox-group"].includes(vnode.name)) {
				// Append component children
				const children = (vnode.options || []).map((e, i) => {
					switch (vnode.name) {
						// el-select
						case "el-select":
							let label, value;

							if (isString(e)) {
								label = value = e
							} else if (isObject(e)) {
								label = e.label
								value = e.value
							} else {
								console.error(vnode.name, 'options 参数错误')
							}

							return (
								<el-option
									{...{
										props: {
											key: i,
											label,
											value,
											...e.props
										}
									}}
								/>
							);

						// el-radio
						case "el-radio-group":
							return (
								<el-radio {...{
									props: {
										key: i,
										label: e.value,
										...e.props
									}
								}}>
									{e.label}
								</el-radio>
							);

						// el-checkbox
						case "el-checkbox-group":
							return (
								<el-checkbox {...{
									props: {
										key: i,
										label: e.value,
										...e.props
									}
								}}>
									{e.label}
								</el-checkbox>
							);

						default:
							return null;
					}
				});

				return parse_jsx(vnode, { prop, scope, children });
			} else {
				return parse_jsx(vnode, { prop, scope, $scopedSlots });
			}
		} else {
			console.error("Component name is null");
		}
	}
}
