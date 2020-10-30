import cloneDeep from "clone-deep";
import flat from "array.prototype.flat";
import { __vue, __plugins, __inst } from "../options";

export function debounce(fn, delay) {
	let timer = null;

	return function () {
		let args = arguments;
		let context = this;

		if (timer) {
			clearTimeout(timer);

			timer = setTimeout(function () {
				fn.apply(context, args);
			}, delay);
		} else {
			timer = setTimeout(function () {
				fn.apply(context, args);
			}, delay);
		}
	};
}

export function throttle(fn, delay) {
	let prev = Date.now();
	return function () {
		let args = arguments;
		let context = this;
		let now = Date.now();

		if (now - prev > delay) {
			fn.apply(context, args);
			prev = Date.now();
		}
	};
}

export function isArray(value) {
	if (typeof Array.isArray === "function") {
		return Array.isArray(value);
	} else {
		return Object.prototype.toString.call(value) === "[object Array]";
	}
}

export function isObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}

export function isNumber(value) {
	return !isNaN(Number(value));
}

export function isFunction(value) {
	return typeof value === "function";
}

export function isString(value) {
	return typeof value === "string";
}

export function isNull(value) {
	return !value && value !== 0;
}

export function isBoolean(value) {
	return typeof value === "boolean";
}

export function isEmpty(value) {
	if (isArray(value)) {
		return value.length === 0;
	}

	if (isObject(value)) {
		return Object.keys(value).length === 0;
	}

	return value === "" || value === undefined || value === null;
}

export function clone(obj) {
	return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}

export function certainProperty(obj, keys) {
	return keys.reduce((result, key) => {
		if (obj.hasOwnProperty(key)) {
			result[key] = obj[key];
		}

		return result;
	}, {});
}

export function getParent(name) {
	let parent = this.$parent;

	while (parent) {
		if (parent.$options.componentName !== name) {
			parent = parent.$parent;
		} else {
			return parent;
		}
	}

	return null;
}

export function dataset(obj, key, value) {
	const isGet = value === undefined;
	let d = obj;

	let arr = flat(
		key.split(".").map((e) => {
			if (e.includes("[")) {
				return e.split("[").map((e) => e.replace(/"/g, ""));
			} else {
				return e;
			}
		})
	);

	try {
		for (let i = 0; i < arr.length; i++) {
			let e = arr[i];
			let n = null;

			if (e.includes("]")) {
				let [k, v] = e.replace("]", "").split(":");

				if (v) {
					n = d.findIndex((x) => x[k] == v);
				} else {
					n = Number(n);
				}
			} else {
				n = e;
			}

			if (i != arr.length - 1) {
				d = d[n];
			} else {
				if (isGet) {
					return d[n];
				} else {
					__inst.$set(d, n, value);
				}
			}
		}

		return obj;
	} catch (e) {
		console.error("格式错误", `${key}`);
		return {};
	}
}

export function print(title, value) {
	console.log(title);

	if (value) {
		if (typeof value == "object") {
			let obj = {};

			for (let i in value) {
				obj[i] = value[i];
			}

			if (console.table) {
				console.table(obj);
			} else {
				console.log(obj);
			}
		} else {
			console.log(value);
		}
	} else {
		console.log(value);
	}
}

export function resetForm(items, form) {
	items.forEach((e) => {
		if (isArray(e.value)) {
			form[e.prop] = [];
		} else if (isObject(e.value)) {
			form[e.prop] = {};
		} else {
			form[e.prop] = undefined;
		}
	});
}

export function clearForm(form) {
	for (let i in form) {
		if (isArray(form[i])) {
			form[i] = [];
		} else if (isObject(form[i])) {
			form[i] = {};
		} else {
			form[i] = undefined;
		}
	}
}

export function deepMerge(a, b) {
	let k;
	for (k in b) {
		a[k] =
			a[k] && a[k].toString() === "[object Object]" ? deepMerge(a[k], b[k]) : (a[k] = b[k]);
	}
	return a;
}

export function contains(parent, node) {
	if (document.documentElement.contains) {
		return parent !== node && parent.contains(node);
	} else {
		while (node && (node = node.parentNode)) if (node === parent) return true;
		return false;
	}
}

export { cloneDeep, flat };
