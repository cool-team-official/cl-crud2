import Emitter from "@/mixins/emitter";
import { __inst } from "@/options";

export default {
	name: "cl-upsert",
	componentName: "ClUpsert",
	inject: ["crud"],
	mixins: [Emitter],
	props: {
		// Bind value
		value: {
			type: Object,
			default: () => {
				return {};
			}
		},
		// Form items
		items: Array,
		// el-dialog attributes
		props: {
			type: Object,
			default: () => {
				return {};
			}
		},
		// Edit sync
		sync: Boolean,
		// Hidden operation button
		hiddenOp: Boolean,
		// Op button ['close', 'save'] | ["cancel", "confirm"]
		opList: {
			type: Array,
			default: () => ["close", "save"]
		},
		// Save button text
		saveButtonText: {
			type: String,
			default: "保存"
		},
		// Close button text
		closeButtonText: {
			type: String,
			default: "关闭"
		},
		// Hook by open { isEdit, data, { submit, done, close } }
		onOpen: Function,
		// Hook by close { action, done }
		onClose: Function,
		// Hook by info { data, { next, done, close } }
		onInfo: Function,
		// Hook by submit { isEdit, data, { next, done, close } }
		onSubmit: Function
	},
	data() {
		return {
			isEdit: false,
			form: {}
		};
	},
	watch: {
		value: {
			immediate: true,
			deep: true,
			handler(val) {
				this.form = val;
			}
		}
	},
	created() {
		this.$on("crud.add", this.add);
		this.$on("crud.append", this.append);
		this.$on("crud.edit", this.edit);
		this.$on("crud.close", this.close);
	},
	mounted() {
		this.inject();
	},
	methods: {
		add() {
			this.isEdit = false;
			this.form = {};
			this.open();
			this.$emit("open", false, {});
		},

		append(data) {
			this.isEdit = false;

			// Assign data
			if (data) {
				for (let i in data) {
					this.$set(this.form, i, data[i]);
				}
			}

			this.open();
			this.$emit("open", false, data);
		},

		edit(data) {
			const { showLoading, hiddenLoading } = this.$refs["form"];

			// Is edit
			this.isEdit = true;
			// Start loading
			showLoading();

			// Async open form
			if (!this.sync) {
				this.open();
			}

			// Finish
			const done = (data) => {
				// Assign data
				Object.assign(this.form, data);
			};

			// Close
			const close = () => {
				done();
				this.close();
			};

			// Submit
			const next = (data) => {
				// Get Service and Dict
				const { dict, service } = this.crud;
				// Get api.info
				const reqName = dict.api.info;

				return new Promise((resolve, reject) => {
					// Validate
					if (!service[reqName]) {
						reject(`Request function '${reqName}' is not fount!`);
						hiddenLoading();
						return null;
					}

					// Send request
					service[reqName]({
						id: data.id
					})
						.then((res) => {
							// Fill datga
							done(res);
							resolve(res);

							// Sync open form
							if (this.sync) {
								this.open();
							}

							// Callback
							this.$emit("open", this.isEdit, this.form);
						})
						.catch((err) => {
							this.$message.error(err);
							reject(err);
						})
						.done(() => {
							hiddenLoading();
						});
				});
			};

			// Hook by onInfo
			if (this.onInfo) {
				this.onInfo(data, { next, done, close });
			} else {
				next(data);
			}
		},

		open() {
			this.$refs["form"].open({
				items: this.items,
				props: {
					title: this.isEdit ? "编辑" : "新增",
					...this.props
				},
				op: {
					...this.op,
					hidden: this.hiddenOp,
					layout: this.opList,
					confirmButtonText: this.saveButtonText,
					cancelButtonText: this.closeButtonText
				},
				on: {
					open: (data, { done, close }) => {
						if (this.onOpen) {
							this.onOpen(this.isEdit, this.form, {
								submit: () => {
									this.submit(this.form);
								},
								done,
								close
							});
						}
					},
					submit: this.submit,
					close: this.close
				},
				_data: {
					isEdit: this.isEdit
				}
			});
		},

		close(action = "close") {
			const done = () => {
				this.$refs["form"].close();
				this.$emit("close", action);
			};

			if (action === "submit") {
				done();
			} else {
				if (this.onClose) {
					this.onClose(action, done);
				} else {
					done();
				}
			}
		},

		done() {
			this.$refs["form"].done();
		},

		/**
		 * Submit form
		 * @param {*} data
		 */
		submit(data, { done }) {
			// Get Service and Dict
			const { dict, service } = this.crud;

			// Submit
			const next = (data) => {
				return new Promise((resolve, reject) => {
					// Judge update or add
					const func = this.isEdit ? "update" : "add";
					// Get request function
					const reqName = dict.api[func];

					// Validate
					if (!service[reqName]) {
						done();
						return reject(`Request function '${reqName}' is not fount!`);
					}

					// Send request
					service[reqName](data)
						.then((res) => {
							this.$message.success("保存成功");
							// Close
							this.close("submit");
							// Refresh
							this.crud.refresh();
							// Callback
							resolve(res);
						})
						.catch((err) => {
							this.$message.error(err);
							reject(err);
						})
						.done(done);
				});
			};

			// Hook by onSubmit
			if (this.onSubmit) {
				// Get mount variable
				const { $refs } = __inst;

				this.onSubmit(this.isEdit, data, {
					$refs,
					done,
					next,
					close: () => {
						this.close("submit");
					}
				});
			} else {
				next(data);
			}
		},

		// Inject form api
		inject() {
			const fns = [
				"getForm",
				"setForm",
				"setData",
				"setOptions",
				"toggleItem",
				"hiddenItem",
				"showItem"
			];

			fns.forEach((e) => {
				this[e] = this.$refs["form"][e];
			});
		}
	},

	render() {
		return (
			<div class="cl-upsert">
				<cl-form
					ref="form"
					v-model={this.form}
					{...{
						scopedSlots: {
							...this.$scopedSlots
						}
					}}></cl-form>
			</div>
		);
	}
};