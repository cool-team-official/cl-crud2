import { deepMerge, isFunction } from "@/utils";
import { renderNode } from "@/utils/vnode";
import Form from "@/utils/form";
import Parse from "@/utils/parse";
import { __inst } from "@/options";
import Emitter from "@/mixins/emitter";
import Screen from "@/mixins/screen";
import cloneDeep from "clone-deep";

export default {
	name: "cl-form",
	componentName: "ClForm",
	mixins: [Emitter, Screen],
	props: {
		// Bind value
		value: {
			type: Object,
			default: () => {
				return {};
			}
		}
	},
	data() {
		return {
			visible: false,
			saving: false,
			loading: false,
			form: {},

			conf: {
				on: {
					open: null,
					submit: null,
					close: null
				},
				props: {
					fullscreen: false,
					"append-to-body": true,
					"close-on-click-modal": false,
					"destroy-on-close": true
				},
				op: {
					hidden: false,
					confirmButtonText: "保存",
					cancelButtonText: "取消",
					layout: ["cancel", "confirm"]
				},
				hdr: {
					hidden: false,
					opList: ["fullscreen", "close"]
				},
				items: [],
				_data: {}
			}
		};
	},
	watch: {
		value: {
			immediate: true,
			deep: true,
			handler(val) {
				this.form = val;
			}
		},
		form: {
			immediate: true,
			handler(val) {
				this.$emit("input", val);
			}
		}
	},
	created() {
		Form.inject.call(this, {
			form: this.form,
			scope: "conf."
		});
	},
	methods: {
		open(options = {}) {
			// Merge conf
			for (let i in this.conf) {
				if (i == "items") {
					this.conf.items = cloneDeep(options.items || []);
				} else {
					deepMerge(this.conf[i], options[i]);
				}
			}

			// Show dialog
			this.visible = true;

			// Preset form
			if (options.form) {
				for (let i in options.form) {
					this.$set(this.form, i, options.form[i]);
				}
			}

			// Set form data by items
			this.conf.items.map((e) => {
				if (e.prop) {
					// Priority use form data
					this.$set(this.form, e.prop, this.form[e.prop] || cloneDeep(e.value));
				}
			});

			// Open callback
			const { open } = this.conf.on;

			if (open) {
				this.$nextTick(() => {
					open(this.form, {
						close: this.beforeClose,
						submit: this.submit,
						done: this.done
					});
				});
			}
		},

		beforeClose(action = "close") {
			// Close event
			const done = () => {
				this.close();
			};

			// Hooks event
			if (this.conf.on.close) {
				this.conf.on.close(action, done);
			} else {
				done();
			}
		},

		close() {
			this.visible = false;
			this.clear();
			this.done();
		},

		done() {
			this.saving = false;
		},

		clear() {
			this.clearForm();
		},

		submit() {
			// Validate form
			this.$refs["form"].validate(async (valid) => {
				if (valid) {
					this.saving = true;

					// Hooks event
					const { submit } = this.conf.on;

					// Get mount variable
					const { $refs } = __inst;

					// Hooks by onSubmit
					if (isFunction(submit)) {
						let d = cloneDeep(this.form);

						// Filter hidden data
						this.conf.items.forEach((e) => {
							if (e._hidden) {
								delete d[e.prop];
							}
						});

						submit(d, {
							done: this.done,
							close: () => {
								this.beforeClose("submit");
							},
							$refs
						});
					} else {
						console.error("on[submit] is not found");
					}
				}
			});
		},

		showLoading() {
			this.loading = true;
		},

		hiddenLoading() {
			this.loading = false;
		},

		collapseItem(item) {
			if (item.collapse !== undefined) {
				item.collapse = !item.collapse;
			}
		},

		formRender() {
			const { props, items } = this.conf;

			return (
				<el-form
					ref="form"
					class="cl-form"
					{...{
						props: {
							size: "small",
							"label-width": "100px",
							"label-position": this.isFullscreen ? "top" : "",
							disabled: this.saving,
							model: this.form,
							...props
						}
					}}>
					<el-row gutter={10} v-loading={this.loading}>
						{items.map((e, i) => {
							// Is hidden
							e._hidden = Parse("hidden", {
								value: e.hidden,
								scope: this.form,
								data: this.conf._data
							});

							// Is flex
							if (e.flex === undefined) {
								e.flex = true;
							}

							return (
								!e._hidden && (
									<el-col
										key={`form-item-${i}`}
										{...{
											props: {
												key: i,
												span: 24,
												...e
											}
										}}>
										{e.component && (
											<el-form-item
												{...{
													props: {
														label: e.label,
														prop: e.prop,
														rules: e.rules,
														...e.props
													}
												}}>
												{/* Redefine label */}
												<template slot="label">
													<span
														on-click={() => {
															this.collapseItem(e);
														}}>
														{e.label}
													</span>
												</template>

												{/* Form item */}
												<div class="cl-form-item">
													{/* Component */}
													{["prepend", "component", "append"].map(
														(name) => {
															return (
																e[name] && (
																	<div
																		class={[
																			`cl-form-item__${name}`,
																			{
																				"is-flex": e.flex
																			}
																		]}
																		v-show={!e.collapse}>
																		{renderNode(e[name], {
																			prop: e.prop,
																			scope: this.form,
																			$scopedSlots: this
																				.$scopedSlots
																		})}
																	</div>
																)
															);
														}
													)}

													{/* Collapse button */}
													<div
														class="cl-form-item__collapse"
														v-show={e.collapse}
														on-click={() => {
															this.collapseItem(e);
														}}>
														<el-divider content-position="center">
															点击展开，查看更多
															<i class="el-icon-arrow-down"></i>
														</el-divider>
													</div>
												</div>
											</el-form-item>
										)}
									</el-col>
								)
							);
						})}
					</el-row>
				</el-form>
			);
		},

		footerRender() {
			const { hidden, layout, confirmButtonText, cancelButtonText } = this.conf.op;
			const { size = "small" } = this.conf.props;

			return (
				<div class="cl-form__footer">
					{!hidden &&
						layout.map((vnode) => {
							if (vnode == "confirm" || vnode == "save") {
								return (
									<el-button
										{...{
											props: {
												size,
												type: "success",
												disabled: this.loading,
												loading: this.saving
											},
											on: {
												click: this.submit
											}
										}}>
										{confirmButtonText}
									</el-button>
								);
							} else if (vnode == "cancel" || vnode == "close") {
								return (
									<el-button
										{...{
											props: {
												size
											},
											on: {
												click: () => {
													this.beforeClose(vnode);
												}
											}
										}}>
										{cancelButtonText}
									</el-button>
								);
							} else {
								return renderNode(vnode, {
									scope: this.form,
									$scopedSlots: this.$scopedSlots
								});
							}
						})}
				</div>
			);
		}
	},

	render() {
		let { props, hdr } = this.conf;

		return (
			<div class="cl-form">
				<cl-dialog
					visible={this.visible}
					title={props.title}
					opList={hdr.opList}
					{...{
						props: {
							props
						},
						on: {
							"update:visible": () => {
								this.beforeClose();
							},
							"update:props:fullscreen": (f) => (props.fullscreen = f)
						}
					}}>
					<div class="cl-form__container">{this.formRender()}</div>
					<template slot="footer">{this.footerRender()}</template>
				</cl-dialog>
			</div>
		);
	}
};
