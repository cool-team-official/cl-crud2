import * as global from "./global";
import * as comps from "./components";

require("./common");

export const CRUD = {
	version: "0.3.8",

	install: function (Vue, options) {
		const { crud, components, plugins } = options || {};

		// 设置全局参数
		global.__crud = crud;
		global.__vue = Vue;
		global.__components = components;
		global.__plugins = plugins;
		global.__inst = new Vue();

		// 注册组件
		for (let i in comps) {
			Vue.component(comps[i].name, comps[i]);
		}

		// 挂载 $crud
		Vue.prototype.$crud = {
			emit: (name, callback) => {
				global.__inst.$emit(name, callback);
			}
		};
	}
};

export default CRUD;
