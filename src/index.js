import { __crud, __vue, __components, __plugins, __inst } from "./options";
import { deepMerge } from "./utils";
import Crud from "./components/crud";
import * as comps from "./components";

require("./common");

export const CRUD = {
	version: "0.3.2",

	install: function (Vue, options) {
		const { crud, components, plugins } = options || {};

		// 合并参数
		deepMerge(__crud, crud);
		deepMerge(__vue, Vue);
		deepMerge(__components, components);
		deepMerge(__plugins, plugins);
		deepMerge(__inst, new Vue());

		// crud 组件
		Vue.component("cl-crud", Crud({ __crud, __components }));

		// 注册组件
		for (let i in comps) {
			Vue.component(comps[i].name, comps[i]);
		}

		// 挂载 $crud
		Vue.prototype.$crud = {
			emit: (name, callback) => {
				__inst.$emit(name, callback);
			}
		};
	}
};

export default CRUD;
