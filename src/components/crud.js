import { deepMerge, isArray, isString, isObject, isFunction } from "@/utils";
import { bootstrap } from "@/app";
import { __inst } from "@/options";
import Emitter from "@/mixins/emitter";

require("@/assets/css/index.styl");

export default function ({ __crud }) {
	return {
		name: "cl-crud",
		componentName: "ClCrud",

		props: {
			name: String,
			onDelete: Function,
			onRefresh: Function
		},

		mixins: [Emitter],

		provide() {
			return {
				crud: this
			};
		},

		data() {
			return {
				service: null,
				loading: false,
				selection: [],
				test: {
					refreshRd: null,
					sortLock: false,
					process: false
				},
				permission: {
					update: true,
					page: true,
					info: true,
					list: true,
					add: true,
					delete: true
				},
				dict: {
					api: {
						list: "list",
						add: "add",
						update: "update",
						delete: "delete",
						info: "info",
						page: "page"
					},
					pagination: {
						page: "page",
						size: "size"
					},
					search: {
						keyWord: "keyWord",
						query: "query"
					},
					sort: {
						order: "order",
						prop: "prop"
					}
				},
				params: {
					page: 1,
					size: 20
				},
				fn: {
					permission: null
				},
				upsert: {
					items: [],
					props: {},
					opList: ["close", "save"],
					sync: false,
					saveButtonText: "保存",
					closeButtonText: "关闭"
				},
				event: {}
			};
		},

		created() {
			this.$on("table.selection-change", ({ selection }) => {
				this.selection = selection;
			});
		},

		mounted() {
			// Merge crud data
			const res = bootstrap(deepMerge(this, __crud));

			// Hooks by load
			this.$emit("load", res);

			// Register event
			for (let i in this.event) {
				let d = this.event[i];
				let mode = null;
				let callback = null;

				if (isObject(d)) {
					mode = d.mode;
					callback = d.callback;
				} else {
					mode = "on";
					callback = d;
				}

				if (!["on", "once"].includes(mode)) {
					return console.error(`Event[${i}].mode must be (on / once)`);
				}

				if (!isFunction(callback)) {
					return console.error(`Event[${i}].callback is not a function`);
				}

				__inst[`$${mode}`](i, (data) => {
					callback(data, res);
				});
			}

			// Window onresize
			window.removeEventListener("resize", function () { });
			window.addEventListener("resize", () => {
				this.broadcast("cl-table", "crud.resize");
			});
		},

		methods: {
			// Get service permission
			getPermission(key) {
				switch (key) {
					case "edit":
					case "update":
						return this.permission["update"];
					default:
						return this.permission[key];
				}
			},

			// Upsert add
			rowAdd() {
				this.broadcast("cl-upsert", "crud.add");
			},

			// Upsert edit
			rowEdit(data) {
				this.broadcast("cl-upsert", "crud.edit", data);
			},

			// Upsert append
			rowAppend(data) {
				this.broadcast("cl-upsert", "crud.append", data);
			},

			// Upsert close
			rowClose() {
				this.broadcast("cl-upsert", "crud.close");
			},

			// Row delete
			rowDelete(...selection) {
				// Get request function
				const reqName = this.dict.api.delete;

				let params = {
					ids: selection.map((e) => e.id).join(",")
				};

				// Delete
				const next = (params) => {
					return new Promise((resolve, reject) => {
						this.$confirm(`此操作将永久删除选中数据，是否继续？`, "提示", {
							type: "warning"
						})
							.then((res) => {
								if (res === "confirm") {
									// Validate
									if (!this.service[reqName]) {
										return reject(`Request function '${reqName}' is not fount`);
									}

									// Send request
									this.service[reqName](params)
										.then((res) => {
											this.$message.success(`删除成功`);
											this.refresh();
											resolve(res);
										})
										.catch((err) => {
											this.$message.error(err);
											reject(err);
										});
								}
							})
							.catch(() => null);
					});
				};

				if (this.onDelete) {
					this.onDelete(selection, { next });
				} else {
					next(params);
				}
			},

			// Multi delete
			deleteMulti() {
				this.rowDelete.apply(this, this.selection || []);
			},

			// Open advSearch
			openAdvSearch() {
				this.broadcast("cl-adv-search", "crud.open");
			},

			// close advSearch
			closeAdvSearch() {
				this.broadcast("cl-adv-search", "crud.close");
			},

			// Refresh params replace
			paramsReplace(params) {
				const { pagination, search, sort } = this.dict;
				let a = { ...params };
				let b = { ...pagination, ...search, ...sort };

				for (let i in b) {
					if (a.hasOwnProperty(i)) {
						if (i != b[i]) {
							a[`_${b[i]}`] = a[i];

							delete a[i];
						}
					}
				}

				for (let i in a) {
					if (i[0] === "_") {
						a[i.substr(1)] = a[i];

						delete a[i];
					}
				}

				return a;
			},

			// Service refresh
			refresh(newParams = {}) {
				// 设置参数
				let params = this.paramsReplace(Object.assign(this.params, newParams));

				// Loading
				this.loading = true;

				// 预防脏数据
				let rd = (this.test.refreshRd = Math.random());

				// 完成事件
				const done = () => {
					this.loading = false;
				};

				// 渲染
				const render = (list, pagination) => {
					this.broadcast("cl-table", "crud.refresh", { list });
					this.broadcast("cl-pagination", "crud.refresh", pagination);
					done();
				};

				// 请求执行
				const next = (params) => {
					return new Promise((resolve, reject) => {
						const reqName = this.dict.api.page;

						if (!this.service[reqName]) {
							done();
							return reject(`Request function '${reqName}' is not fount`);
						}

						this.service[reqName](params)
							.then((res) => {
								if (rd != this.test.refreshRd) {
									return false;
								}

								if (isString(res)) {
									return reject("Response error");
								}

								if (isArray(res)) {
									render(res);
								} else if (isObject(res)) {
									render(res.list, res.pagination);
								}

								resolve(res);
							})
							.catch((err) => {
								console.error(err);
								this.$message.error(err);
								reject(err);
							})
							.done(() => {
								done();
								this.test.sortLock = true;
							});
					});
				};

				if (this.onRefresh) {
					return this.onRefresh(params, { next, done, render });
				} else {
					return next(params);
				}
			},

			// Layout again
			doLayout() {
				this.broadcast("ClTable", "resize");
			},

			done() {
				// Done render
				this.test.process = true;
			}
		},

		render() {
			return <div class="cl-crud">{this.$slots.default}</div>;
		}
	};
}
