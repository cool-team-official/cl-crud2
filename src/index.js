import { __crud, __vue, __components, __plugins, __inst } from "./options";
import { deepMerge } from "./utils";
import Crud from "./components/crud";
import * as comps from "./components";

require("./common");

export const CRUD = {
	version: "0.3.3",

	install: function (app, options) {
		const { crud, components, plugins } = options || {};

		// 合并参数
		deepMerge(__crud, crud);
		deepMerge(__vue, Vue);
		deepMerge(__components, components);
		deepMerge(__plugins, plugins);
		// deepMerge(__inst, new app());

		// crud 组件
		app.component("cl-crud", Crud({ __crud, __components }));

		// 注册组件
		for (let i in comps) {
			app.component(comps[i].name, comps[i]);
		}

		// 挂载 $crud
		app.config.globalProperties.$crud = {
			emit: (name, callback) => {
				__inst.$emit(name, callback);
			}
		};
	}
};

export default CRUD;
